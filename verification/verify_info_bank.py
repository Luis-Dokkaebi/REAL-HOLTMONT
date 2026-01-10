from playwright.sync_api import sync_playwright
import os

def mock_backend(page):
    # Mock window.google.script.run
    page.add_init_script("""
        window.google = window.google || {};
        window.google.script = window.google.script || {};
        window.google.script.run = {
            withSuccessHandler: function(successCallback) {
                this.successCallback = successCallback;
                return this;
            },
            withFailureHandler: function(failureCallback) {
                this.failureCallback = failureCallback;
                return this;
            },
            apiLogin: function(user, pass) {
                if (this.successCallback) {
                    this.successCallback({
                        success: true,
                        name: 'Admin User',
                        username: 'LUIS_CARLOS',
                        role: 'ADMIN'
                    });
                }
            },
            getSystemConfig: function(role) {
                if (this.successCallback) {
                    this.successCallback({
                        departments: {},
                        staff: [],
                        directory: [],
                        specialModules: [],
                        accessProjects: true
                    });
                }
            },
            apiFetchDrafts: function() {
                if (this.successCallback) {
                    this.successCallback({ success: true, data: [] });
                }
            },
            apiFetchCascadeTree: function() {
                if (this.successCallback) {
                    this.successCallback({ success: true, data: [] });
                }
            },
            apiFetchInfoBankData: function(year, month, company, folder) {
                // We don't need real files, just the call to complete to stop loading spinners
                if (this.successCallback) {
                    this.successCallback({ success: true, data: [] });
                }
            },
            apiLogout: function() { return; }
        };
    """)

def verify_info_bank():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Determine path to index.html
        cwd = os.getcwd()
        file_path = f"file://{cwd}/index.html"

        mock_backend(page)

        print(f"Navigating to {file_path}")
        page.goto(file_path)

        # Login
        page.fill('input[placeholder="Usuario"]', 'LUIS_CARLOS')
        page.fill('input[placeholder="Contraseña..."]', 'password')
        page.click('button:has-text("INICIAR SESIÓN")')

        # Wait for dashboard
        page.wait_for_selector('text=Dashboard')

        # Click BANCO DE INFORMACION
        print("Clicking BANCO DE INFORMACION")
        page.click('text=BANCO DE INFORMACION')
        page.wait_for_selector('text=Selecciona el Año')

        # 1. Verify OCTUBRE 2025: DANFOSS 4
        print("Verifying Oct 2025")
        page.click('text=2025')
        page.wait_for_selector('text=Selecciona el Mes')
        page.click('text=Octubre')
        page.wait_for_selector('text=Empresas - Octubre 2025')
        page.wait_for_timeout(500) # Wait for animation
        page.screenshot(path="verification/oct_2025.png")

        # 2. Verify NOVIEMBRE 2025: PANASONIC MTY, PANASONIC NORTE, ALCOM
        print("Verifying Nov 2025")
        page.click('button:has-text("Volver")') # Back to months
        page.wait_for_selector('text=Selecciona el Mes')
        page.click('text=Noviembre')
        page.wait_for_selector('text=Empresas - Noviembre 2025')
        page.wait_for_timeout(500)
        page.screenshot(path="verification/nov_2025.png")

        # 3. Verify DICIEMBRE 2025: VERTIV, CORNING 1, PANASONIC MTY, PANASONIC
        print("Verifying Dec 2025")
        page.click('button:has-text("Volver")') # Back to months
        page.wait_for_selector('text=Selecciona el Mes')
        page.click('text=Diciembre')
        page.wait_for_selector('text=Empresas - Diciembre 2025')
        page.wait_for_timeout(500)
        page.screenshot(path="verification/dec_2025.png")

        # 4. Verify ENERO 2026: EATON 3, WC RY, CORNING 1
        print("Verifying Jan 2026")
        page.click('button:has-text("Volver")') # Back to months 2025
        page.click('button:has-text("Volver")') # Back to years
        page.click('text=2026')
        page.wait_for_selector('text=Selecciona el Mes')
        page.click('text=Enero')
        page.wait_for_selector('text=Empresas - Enero 2026')
        page.wait_for_timeout(500)
        page.screenshot(path="verification/jan_2026.png")

        browser.close()

if __name__ == "__main__":
    verify_info_bank()
