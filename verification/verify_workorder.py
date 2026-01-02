from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load local HTML file
        file_path = os.path.abspath("index.html")
        page.goto(f"file://{file_path}")

        # Inject mock for google.script.run
        page.evaluate("""
            window.google = {
                script: {
                    run: {
                        withSuccessHandler: function(callback) {
                            this.successCallback = callback;
                            return this;
                        },
                        withFailureHandler: function(callback) {
                            this.failureCallback = callback;
                            return this;
                        },
                        apiLogin: function(user, pass) {
                            console.log("Mock apiLogin called for", user);
                            if (user === 'PREWORK_ORDER') {
                                this.successCallback({
                                    success: true,
                                    role: 'WORKORDER_USER',
                                    name: 'Workorder',
                                    username: 'PREWORK_ORDER'
                                });
                            }
                        },
                        getSystemConfig: function(role) {
                            console.log("Mock getSystemConfig called for", role);
                            const depts = {
                                "ELECTRO": { label: "Electromecánica", icon: "fa-bolt", color: "#ffc107" },
                                "CONSTRUCCION": { label: "Construcción", icon: "fa-hard-hat", color: "#e83e8c" }
                            };
                            if (role === 'WORKORDER_USER') {
                                this.successCallback({
                                    departments: depts,
                                    allDepartments: depts,
                                    staff: [{ name: "Juan Perez", dept: "ELECTRO" }],
                                    directory: [{ name: "Juan Perez", dept: "ELECTRO" }],
                                    specialModules: [{ id: "PPC_MASTER", label: "Workorder", icon: "fa-tasks", color: "#fd7e14", type: "ppc_native" }],
                                    accessProjects: false
                                });
                            }
                        },
                        apiFetchPPCData: function() {
                             if(this.successCallback) this.successCallback({success: true, data: []});
                        },
                        apiSavePPCData: function(payload, user) {
                            console.log("Mock apiSavePPCData called with", payload);
                            const id = "0001MB Electro 010126";
                            this.successCallback({ success: true, message: "OK", ids: [id] });
                        },
                        apiUpdatePPCV3: function(payload, user) {
                            console.log("Mock apiUpdatePPCV3 called with", payload);
                            this.successCallback({ success: true, message: "Updated" });
                        },
                        apiFetchCascadeTree: function() {
                            console.log("Mock apiFetchCascadeTree");
                            if(this.successCallback) this.successCallback({success: true, data: []});
                        }
                    }
                }
            };
        """)

        # Login as PREWORK_ORDER
        page.fill("input[placeholder='Usuario']", "PREWORK_ORDER")
        page.fill("input[placeholder='Contraseña...']", "password")
        page.click("button:has-text('INICIAR SESIÓN')")

        # Wait a bit
        page.wait_for_timeout(2000)

        print("Clicking Workorder card...")
        page.click("div.dept-card:has-text('Workorder')")

        # Wait for Workorder Form
        page.wait_for_selector("h4:has-text('WORKORDER')")

        # Fill Form
        page.fill("input[placeholder='Ej: MERCEDES BENZ']", "MERCEDES BENZ") # Cliente
        page.fill("input[type='email']", "contact@mb.com") # Contacto

        # Select Department
        page.select_option("select.form-select", value="ELECTRO")

        # Just type into input directly if chip logic is complex
        # But 'cotizador' is updated when LI is clicked.
        # Let's try filling the input and hitting enter? No logic for enter.
        # Let's try simulating the click again but waiting properly.

        print("Clicking search input...")
        page.click("input[placeholder='Buscar...']")
        page.type("input[placeholder='Buscar...']", "Juan")

        page.wait_for_timeout(500) # Wait for debounce or render

        print("Clicking list item...")
        page.click("li:has-text('Juan Perez')")

        # Click Save
        print("Saving...")
        page.click("button:has-text('GUARDAR Y GENERAR FOLIO')")

        # Wait for Details Modal (Detalles)
        page.wait_for_selector("div.custom-modal-header:has-text('Detalles')")

        page.screenshot(path="verification/workorder_flow.png")
        print("Screenshot saved to verification/workorder_flow.png")

        browser.close()

if __name__ == "__main__":
    run()
