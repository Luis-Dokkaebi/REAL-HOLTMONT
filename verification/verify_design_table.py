from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 2000})

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
                                        },
                                        uploadFileToDrive: function(data, type, name) {
                                            success({ success: true, fileUrl: 'https://mock.url/file.png' });
                                        }
                                    };
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
                                apiGetNextWorkOrderSeq: function() { success('0001'); },
                                apiFetchCascadeTree: function() { success({ success: true, data: [] }); },
                                uploadFileToDrive: function(data, type, name) { success({ success: true, fileUrl: 'https://mock.url/file.png' }); }
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
        page.click('div.dept-card h6:has-text("Workorder Module")')
        page.wait_for_timeout(1000)

        # Scroll to the new section "DISEÑO / MAQUINADOS / DIBUJOS"
        # It should be below "MANO DE OBRA"

        # Add a row to the new table
        page.click('h6:has-text("DISEÑO / MAQUINADOS / DIBUJOS") + div button:has-text("Agregar")')
        page.wait_for_timeout(500)

        target_locator = page.locator('h6:has-text("DISEÑO / MAQUINADOS / DIBUJOS")')
        target_locator.scroll_into_view_if_needed()

        # Take a screenshot focusing on the new section
        # We can locate the card parent
        card_locator = page.locator('div.card:has(h6:has-text("DISEÑO / MAQUINADOS / DIBUJOS"))')
        card_locator.screenshot(path="verification_design_table.png")

        browser.close()

if __name__ == "__main__":
    run()
