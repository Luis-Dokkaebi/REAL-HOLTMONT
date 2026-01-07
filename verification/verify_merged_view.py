from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Determine the absolute path to index.html
        cwd = os.getcwd()
        file_path = f"file://{cwd}/index.html"

        print(f"Navigating to {file_path}")
        page.goto(file_path)

        # Inject mock for google.script.run to bypass login
        page.evaluate("""
            window.google = {
                script: {
                    run: {
                        withSuccessHandler: function(callback) {
                            const apiHandler = {
                                withFailureHandler: function(errCallback) {
                                    return apiHandler;
                                },
                                apiLogin: function(user, pass) {
                                    callback({
                                        success: true,
                                        name: "PREWORK_ORDER",
                                        username: "PREWORK_ORDER",
                                        role: "WORKORDER_USER"
                                    });
                                },
                                apiGetNextWorkOrderSeq: function() {
                                    callback("0001");
                                },
                                getSystemConfig: function(role) {
                                    callback({
                                        departments: {},
                                        staff: [],
                                        directory: [],
                                        accessProjects: false,
                                        specialModules: [{id:'PPC_NATIVE', type:'ppc_native', label:'Workorder', color:'#000', icon:'fa-edit'}]
                                    });
                                },
                                apiFetchCascadeTree: function() {
                                    callback({success: true, data: []});
                                }
                            };
                            return apiHandler;
                        },
                        apiGetNextWorkOrderSeq: function() { return { withSuccessHandler: function(cb) { cb("0001"); }}; },
                        apiFetchCascadeTree: function() { return { withSuccessHandler: function(cb) { cb({success:true, data:[]}); }}; }
                    }
                }
            };
        """)

        # Perform Login
        print("Logging in...")
        page.fill("input[placeholder='Usuario']", "PREWORK_ORDER")
        page.fill("input[placeholder='Contraseña...']", "dummy")
        page.click("button:has-text('INICIAR SESIÓN')")

        # Wait for Dashboard to load and Click Workorder module
        print("Waiting for dashboard...")
        page.wait_for_selector("text=Workorder", timeout=5000)
        print("Clicking Workorder module...")
        page.click("text=Workorder")

        # Wait for Workorder View to load
        print("Waiting for Workorder form...")
        page.wait_for_selector("text=Holtmont Services", timeout=5000)

        # Scroll to the merged section
        print("Scrolling to Description section...")
        desc_element = page.locator("text=Descripción del Trabajo a Realizar")
        desc_element.scroll_into_view_if_needed()

        # Take screenshot of the relevant area (Description + Restrictions)
        card = page.locator(".card").filter(has_text="Descripción del Trabajo a Realizar").first

        if card.count() > 0:
            print("Found merged card.")
            # Ensure "RESTRICCIONES" is visible inside this card
            if card.locator("text=RESTRICCIONES").count() > 0:
                print("RESTRICCIONES found inside the Description card.")
            else:
                print("WARNING: RESTRICCIONES not found inside the Description card.")

            card.screenshot(path="verification/merged_section.png")
        else:
            print("Card not found, taking full page screenshot.")
            page.screenshot(path="verification/full_page.png")

        browser.close()

if __name__ == "__main__":
    run()
