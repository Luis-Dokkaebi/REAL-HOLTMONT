from playwright.sync_api import sync_playwright
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Determine absolute path to index.html
    cwd = os.getcwd()
    file_url = f"file://{cwd}/index.html"

    # Mock google.script.run
    page.add_init_script("""
        window.google = {
            script: {
                run: {
                    withSuccessHandler: function(successCallback) {
                        this.successCallback = successCallback;
                        return this;
                    },
                    withFailureHandler: function(failureCallback) {
                        this.failureCallback = failureCallback;
                        return this;
                    },
                    apiLogin: function(user, pass) {
                        if(this.successCallback) this.successCallback({
                            success: true,
                            name: 'Test User',
                            username: 'TEST_USER',
                            role: 'TONITA'
                        });
                    },
                    getSystemConfig: function(role) {
                        if(this.successCallback) this.successCallback({
                            departments: {'VENTAS': {label: 'Ventas', color: '#0dcaf0', icon: 'fa-handshake'}},
                            staff: [{name: 'ANTONIA_VENTAS', dept: 'VENTAS'}],
                            directory: [],
                            specialModules: []
                        });
                    },
                    apiFetchCascadeTree: function() {
                         if(this.successCallback) this.successCallback({success: true, data: []});
                    },
                    apiFetchStaffTrackerData: function(sheetName) {
                        if(this.successCallback) this.successCallback({
                            success: true,
                            headers: ['FOLIO', 'CLIENTE', 'CONCEPTO', 'AVANCE', 'F2', 'COTIZACION', 'TIMELINE', 'LAYOUT'],
                            data: [
                                {FOLIO: '1001', CLIENTE: 'Cliente A', CONCEPTO: 'Sin Archivos', AVANCE: '10%', F2: '', COTIZACION: '', TIMELINE: '', LAYOUT: ''},
                                {FOLIO: '1002', CLIENTE: 'Cliente B', CONCEPTO: 'Con Archivos', AVANCE: '50%', F2: 'http://url', COTIZACION: 'http://url', TIMELINE: 'http://url', LAYOUT: 'http://url'}
                            ],
                            history: []
                        });
                    },
                    apiFetchDrafts: function() {
                         if(this.successCallback) this.successCallback({success: true, data: []});
                    }
                }
            }
        };
    """)

    page.goto(file_url)

    # Login
    page.fill('input[placeholder="Usuario"]', 'TEST_USER')
    page.fill('input[placeholder="Contraseña..."]', 'pass')
    page.click('button:has-text("INICIAR SESIÓN")')

    # Wait for Dashboard and click Ventas
    page.wait_for_selector('.dept-card')
    page.click('.dept-card h6:has-text("Ventas")')

    # Wait for Staff List and click Antonia
    page.wait_for_selector('.staff-card')
    page.click('.staff-card:has-text("ANTONIA_VENTAS")')

    # Wait for Tracker
    page.wait_for_selector('.table-excel')

    # Wait a bit for rendering
    page.wait_for_timeout(1000)

    # Screenshot
    page.screenshot(path="verification/verify_avance_fix.png")

    browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
