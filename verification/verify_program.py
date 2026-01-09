from playwright.sync_api import sync_playwright, expect
import time

def verify_project_program_sections():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()

        # 1. Mock window.google.script.run
        # NOTE: withSuccessHandler returns a PROXY object in real GAS, so we chain mocks.
        page.add_init_script("""
            window.google = {
                script: {
                    run: {
                        withSuccessHandler: function(callback) {
                            return {
                                withFailureHandler: function() { return this; },
                                apiLogin: function(u, p) {
                                    // Async simulation
                                    setTimeout(() => {
                                        callback({
                                            success: true,
                                            name: 'Workorder User',
                                            username: 'PREWORK_ORDER',
                                            role: 'WORKORDER_USER'
                                        });
                                    }, 100);
                                    return this;
                                },
                                getSystemConfig: function(role) {
                                    setTimeout(() => {
                                        callback({
                                            departments: {},
                                            allDepartments: {
                                                "CONSTRUCCION": { label: "Construcción" },
                                                "VENTAS": { label: "Ventas" }
                                            },
                                            staff: [],
                                            directory: [{name: "JUAN PEREZ", dept: "CONSTRUCCION", type: "ESTANDAR"}],
                                            specialModules: [{ id: "PPC_MASTER", label: "Pre Work Order", icon: "fa-tasks", color: "#fd7e14", type: "ppc_native" }],
                                            accessProjects: false
                                        });
                                    }, 100);
                                    return this;
                                },
                                apiGetNextWorkOrderSeq: function() {
                                    callback('0001');
                                    return this;
                                },
                                apiFetchPPCData: function() {
                                    callback({success: true, data: []});
                                    return this;
                                },
                                apiFetchCascadeTree: function() {
                                    callback({success: true, data: []});
                                    return this;
                                }
                            };
                        },
                        withFailureHandler: function(callback) {
                            return this;
                        },
                        apiLogout: function() {}
                    }
                }
            };
        """)

        # 2. Go to page
        page.goto("http://localhost:8000/index.html")

        # 3. Login
        page.fill("input[placeholder='Usuario']", "PREWORK_ORDER")
        page.fill("input[placeholder='Contraseña...']", "workorder2026")
        page.click("button:has-text('INICIAR SESIÓN')")

        # 4. Open Module
        # Wait for dashboard to load
        page.wait_for_selector(".dept-card", timeout=10000)
        page.click(".dept-card:has-text('Pre Work Order')")

        # 5. Locate Program Sections
        # Scroll to Program Section
        program_card = page.locator("h6:has-text('PROGRAMA DEL PROYECTO')")
        program_card.wait_for(state="visible", timeout=5000)
        program_card.scroll_into_view_if_needed()

        # Verify 4 sections exist
        sections = [
            "1. VISITA",
            "2. Requerimiento para Cotización",
            "3. Cotización Preconstrucción",
            "4. Cotización Trabajo"
        ]

        for section in sections:
            expect(page.get_by_text(section, exact=True)).to_be_visible()

        # 6. Add items to each section
        # Click add button for "1. VISITA" (first button in program section?)
        # Buttons are small with "+" icon inside the section headers.

        # We can find the button relative to the text.
        visita_section = page.locator("div.mb-3").filter(has_text="1. VISITA")
        visita_add_btn = visita_section.locator("button.btn-primary")
        visita_add_btn.click()

        # Verify row added
        expect(visita_section.locator("input[placeholder='Descripción']")).to_have_count(2) # 1 default + 1 added

        # 7. Take Screenshot
        time.sleep(1) # wait for animation
        page.screenshot(path="verification/program_sections.png")
        print("Screenshot saved to verification/program_sections.png")

        browser.close()

if __name__ == "__main__":
    try:
        verify_project_program_sections()
    except Exception as e:
        print(f"Error: {e}")
        exit(1)
