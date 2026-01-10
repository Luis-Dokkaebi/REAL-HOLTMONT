from playwright.sync_api import sync_playwright
import os

def test_info_bank_view():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a consistent viewport
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        # Load the local HTML file
        cwd = os.getcwd()
        page.goto(f"file://{cwd}/index.html")

        # Mock the Google Script Run API
        page.evaluate("""
            window.google = {
                script: {
                    run: {
                        withSuccessHandler: function(callback) {
                            this._successHandler = callback;
                            return this;
                        },
                        withFailureHandler: function(callback) {
                            return this;
                        },
                        apiLogin: function(u, p) {
                            if (u === 'admin' && p === 'admin') {
                                this._successHandler({
                                    success: true,
                                    name: 'Admin User',
                                    username: 'ADMIN',
                                    role: 'ADMIN'
                                });
                            }
                        },
                        getSystemConfig: function(role) {
                            this._successHandler({
                                departments: {},
                                allDepartments: {},
                                staff: [],
                                directory: [],
                                specialModules: []
                            });
                        },
                        apiFetchCascadeTree: function() {
                             this._successHandler({ success: true, data: [] });
                        },
                        apiFetchDrafts: function() {
                             this._successHandler({ success: true, data: [] });
                        },
                        apiFetchInfoBankData: function(year, month, company, folder) {
                            // MOCK DATA for the Info Bank
                            const mockData = [
                                {
                                    'FECHA_INICIO': '01/01/25',
                                    'AREA': 'CONSTRUCCION',
                                    'CONCEPTO': 'Ampliación Nave Industrial Fase 1',
                                    'VENDEDOR': 'JUAN PEREZ',
                                    'ESTATUS': 'VENDIDA',
                                    'FOLIO': '12345',
                                    'COTIZACION': '#'
                                },
                                {
                                    'FECHA_INICIO': '05/01/25',
                                    'AREA': 'ELECTROMECANICA',
                                    'CONCEPTO': 'Mantenimiento Subestación',
                                    'VENDEDOR': 'MARIA LOPEZ',
                                    'ESTATUS': 'COTIZADA',
                                    'FOLIO': '12346',
                                    'COTIZACION': '#'
                                },
                                {
                                    'FECHA_INICIO': '10/01/25',
                                    'AREA': 'HVAC',
                                    'CONCEPTO': 'Instalación Chillers',
                                    'VENDEDOR': 'PEDRO GOMEZ',
                                    'ESTATUS': 'PENDIENTE',
                                    'FOLIO': '12347',
                                    'COTIZACION': '#'
                                }
                            ];
                            this._successHandler({ success: true, data: mockData });
                        }
                    }
                }
            };
        """)

        # Login
        page.fill('input[placeholder="Usuario"]', 'admin')
        page.fill('input[placeholder="Contraseña..."]', 'admin')
        page.click('button:has-text("INICIAR SESIÓN")')

        # Wait for dashboard to load
        page.wait_for_selector('.sidebar')

        # Click on "BANCO DE INFORMACION" in sidebar
        page.click('span:has-text("BANCO DE INFORMACION")')

        # Navigate through Info Bank hierarchy
        # 1. Year
        page.click('h5:has-text("2025")')

        # 2. Month
        page.click('h5:has-text("Enero")')

        # 3. Company
        # Wait for companies list (mocked by static list in frontend)
        # Select first company, e.g., ALCOM or whatever is visible
        page.wait_for_selector('.list-group-item')
        page.click('.list-group-item:first-child')

        # 4. Folder
        # Click on 'TRACKER' folder or similar
        page.click('h6:has-text("TRACKER")')

        # Wait for table to load and animation to start
        page.wait_for_selector('table.table-hover')

        # Wait a bit for animation to complete
        page.wait_for_timeout(1000)

        # Take screenshot
        page.screenshot(path="verification/info_bank_view.png")
        print("Screenshot saved to verification/info_bank_view.png")

        browser.close()

if __name__ == "__main__":
    test_info_bank_view()
