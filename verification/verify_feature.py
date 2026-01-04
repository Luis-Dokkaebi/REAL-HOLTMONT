from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Determine the absolute path to index.html
        cwd = os.getcwd()
        file_path = f"file://{cwd}/index.html"

        # Mock window.google.script.run
        page.add_init_script("""
            window.google = {
                script: {
                    run: {
                        withSuccessHandler: function(success) {
                            return {
                                withFailureHandler: function(failure) {
                                    return {
                                        apiLogin: function(u, p) {
                                            success({
                                                success: true,
                                                name: 'TEST_USER',
                                                username: 'PREWORK_ORDER',
                                                role: 'WORKORDER_USER'
                                            });
                                        },
                                        getSystemConfig: function(role) {
                                            success({
                                                departments: {},
                                                staff: [],
                                                directory: [],
                                                specialModules: [
                                                    { id: 'PPC_MASTER', type: 'ppc_native', label: 'Workorder Module', icon: 'fa-clipboard', color: '#ff0000' }
                                                ]
                                            });
                                        },
                                        apiGetNextWorkOrderSeq: function() {
                                            success('0001');
                                        },
                                        apiSavePPCData: function() {
                                            success({ success: true, ids: ['MOCK-ID'] });
                                        },
                                        apiFetchCascadeTree: function() {
                                            success({ success: true, data: [] });
                                        }
                                    };
                                },
                                getSystemConfig: function(role) {
                                    // Duplicate just in case
                                    success({
                                        departments: {},
                                        staff: [],
                                        directory: [],
                                        specialModules: [
                                            { id: 'PPC_MASTER', type: 'ppc_native', label: 'Workorder Module', icon: 'fa-clipboard', color: '#ff0000' }
                                        ]
                                    });
                                },
                                apiGetNextWorkOrderSeq: function() { success('0001'); },
                                apiFetchCascadeTree: function() { success({ success: true, data: [] }); }
                            };
                        },
                        apiLogout: function() {},
                        apiFetchPPCData: function() {}
                    }
                }
            };
        """)

        page.goto(file_path)

        # Login
        page.fill('input[placeholder="Usuario"]', 'PREWORK_ORDER')
        page.fill('input[placeholder="Contraseña..."]', 'dummy')
        page.click('button:has-text("INICIAR SESIÓN")')

        # Wait for Dashboard Module Card
        page.wait_for_selector('div.dept-card h6:has-text("Workorder Module")')

        # Click the module to open WORKORDER_FORM
        page.click('div.dept-card h6:has-text("Workorder Module")')

        # Wait for form to load
        page.wait_for_timeout(1000)

        # Scroll to the target section "MATERIALES REQUERIDOS"
        target_locator = page.locator('h6:has-text("Compra de Material Programa Papa Caliente")')
        target_locator.scroll_into_view_if_needed()

        # Add a material item
        page.click('div.card-header:has-text("MATERIALES REQUERIDOS") button:has-text("Agregar")')

        page.wait_for_timeout(500)

        page.screenshot(path="verification_tables.png", full_page=True)
        browser.close()

if __name__ == "__main__":
    run()
