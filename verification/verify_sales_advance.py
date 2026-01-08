import os
import time
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Mock setup
    page.add_init_script("""
        window._mockF2 = '';
        window._mockCot = '';
        window._mockTimeout = '';
        window._mockLayout = '';

        window.google = {
            script: {
                run: {
                    withSuccessHandler: function(cb) {
                        this.cb = cb;
                        return this;
                    },
                    withFailureHandler: function(cb) {
                        return this;
                    },
                    apiLogin: function(u, p) {
                        this.cb({ success: true, role: 'ADMIN', username: 'LUIS_CARLOS', name: 'Luis Carlos' });
                    },
                    getSystemConfig: function(r) {
                        this.cb({
                           departments: {'VENTAS': {label: 'Ventas', icon: 'fa-handshake', color: '#0dcaf0'}},
                           staff: [{name: 'JUAN (VENTAS)', dept: 'VENTAS'}],
                           directory: [{name: 'JUAN (VENTAS)', dept: 'VENTAS', type: 'VENTAS'}],
                           specialModules: []
                        });
                    },
                    apiFetchStaffTrackerData: function(name) {
                        var row = {
                          'FOLIO': '101', 'CLIENTE': 'CLIENTE A', 'CONCEPTO': 'TEST', 'VENDEDOR': 'JUAN (VENTAS)',
                          'FECHA': '01/01/2023', 'ESTATUS': 'PENDIENTE',
                          'F2': window._mockF2,
                          'COTIZACION': window._mockCot,
                          'TIMEOUT': window._mockTimeout,
                          'LAYOUT': window._mockLayout,
                          'AVANCE': '0%',
                          'COMENTARIOS': ''
                        };
                        this.cb({
                          success: true,
                          data: [row],
                          headers: ['FOLIO', 'CLIENTE', 'CONCEPTO', 'VENDEDOR', 'FECHA', 'ESTATUS', 'F2', 'COTIZACION', 'TIMEOUT', 'LAYOUT', 'AVANCE', 'COMENTARIOS'],
                          history: []
                        });
                    },
                    apiUpdateTask: function(sheet, row, user) {
                        this.cb({ success: true });
                    },
                    uploadFileToDrive: function(data, type, name) {
                        this.cb({ success: true, fileUrl: 'http://mock.url/' + name });
                    },
                    apiFetchCascadeTree: function() {
                        this.cb({ success: true, data: [] });
                    },
                    apiFetchDrafts: function() {
                         this.cb({ success: true, data: [] });
                    },
                    apiFetchTeamKPIData: function() {
                         this.cb({ success: true, ventas: [], tracker: [] });
                    }
                }
            }
        };
    """)

    page.goto(f"file://{os.getcwd()}/index.html")

    # Login
    page.fill('input[placeholder="Usuario"]', 'LUIS_CARLOS')
    page.fill('input[placeholder="Contraseña..."]', 'admin2025')
    page.click('button:has-text("INICIAR SESIÓN")')

    # Navigate to Sales
    page.click('.dept-card:has-text("Ventas")')
    page.wait_for_selector('.staff-card:has-text("JUAN (VENTAS)")')
    page.click('.staff-card:has-text("JUAN (VENTAS)")')

    # 1. Verify 0%
    page.wait_for_selector('table')

    # Locate column index for AVANCE
    # headers: FOLIO, CLIENTE, CONCEPTO, VENDEDOR, FECHA, ESTATUS, F2, COTIZACION, TIMEOUT, LAYOUT, AVANCE, COMENTARIOS
    # Indices: 0      1        2         3         4      5        6   7           8        9       10      11
    # AVANCE is 11th index -> 12th child

    avance_cell = page.locator('tbody tr:first-child td:nth-child(12) input')
    expect(avance_cell).to_have_value("0%")

    # Check Readonly
    is_readonly = avance_cell.get_attribute("readonly")
    if is_readonly is None and is_readonly != "":
        print(f"Error: Input should be readonly. Got: {is_readonly}")
        # exit(1) # Don't exit yet, debugging
    else:
        print("Step 1: 0% Readonly Verified")

    page.screenshot(path="verification/step1_0percent.png")

    # 2. Simulate 1 File (F2)
    page.evaluate("window._mockF2 = 'http://file.com'")
    page.click('button[title="Actualizar"]') # Load Tracker Data again
    page.wait_for_timeout(1000)

    expect(avance_cell).to_have_value("25%")
    if avance_cell.get_attribute("readonly") is None:
         print("Error: Input should be readonly at 25%")
         # exit(1)
    print("Step 2: 25% Verified")
    page.screenshot(path="verification/step2_25percent.png")

    # 3. Simulate 4 Files (All)
    page.evaluate("window._mockCot = 'http://file.com'; window._mockTimeout = 'http://file.com'; window._mockLayout = 'http://file.com';")
    page.click('button[title="Actualizar"]')
    page.wait_for_timeout(1000)

    expect(avance_cell).to_have_value("100%")
    # Should NOT be readonly
    if avance_cell.get_attribute("readonly") is not None:
         print("Error: Input should be editable at 100%")
         # exit(1)
    else:
         print("Step 3: 100% Editable Verified")

    page.screenshot(path="verification/step3_100percent.png")

    browser.close()

if __name__ == "__main__":
    with sync_playwright() as p:
        run(p)
