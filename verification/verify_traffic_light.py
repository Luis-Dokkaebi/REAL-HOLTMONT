from playwright.sync_api import sync_playwright
import os
import time

def verify_traffic_light():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load local HTML file
        page.goto(f"file://{os.getcwd()}/index.html")

        # Mock Google Apps Script
        page.evaluate("""
            const mockData = {
                departments: { 'CONSTRUCCION': { label: 'Construccion', color: '#e83e8c', icon: 'fa-hard-hat' } },
                staff: [{ name: 'TEST_USER', dept: 'CONSTRUCCION' }],
                directory: [],
                specialModules: []
            };

            const runner = {
                apiLogin: function(user, pass) {
                    console.log('Mock apiLogin');
                    if (this._success) this._success({ success: true, role: 'ADMIN', name: 'Admin User', username: 'ADMIN_USER' });
                },
                getSystemConfig: function(role) {
                    console.log('Mock getSystemConfig');
                    if (this._success) this._success(mockData);
                },
                apiFetchStaffTrackerData: function(name) {
                    console.log('Mock apiFetchStaffTrackerData');
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const d = (daysAgo) => { const dt = new Date(today); dt.setDate(dt.getDate() - daysAgo); return dt; };

                    if (this._success) this._success({
                        success: true,
                        headers: ['ID', 'CONCEPTO', 'FECHA', 'CLASIFICACION', 'DIAS', 'ESTATUS'],
                        data: [
                            { ID: '1', CONCEPTO: 'A - Green (0)', FECHA: d(0), CLASIFICACION: 'A', DIAS: '0', ESTATUS: 'PENDING' },
                            { ID: '2', CONCEPTO: 'A - Green (1)', FECHA: d(1), CLASIFICACION: 'A', DIAS: '1', ESTATUS: 'PENDING' },
                            { ID: '3', CONCEPTO: 'A - Yellow (2)', FECHA: d(2), CLASIFICACION: 'A', DIAS: '2', ESTATUS: 'PENDING' },
                            { ID: '4', CONCEPTO: 'A - Yellow (3)', FECHA: d(3), CLASIFICACION: 'A', DIAS: '3', ESTATUS: 'PENDING' },
                            { ID: '5', CONCEPTO: 'A - Red (4)', FECHA: d(4), CLASIFICACION: 'A', DIAS: '4', ESTATUS: 'PENDING' },
                            { ID: '6', CONCEPTO: 'AA - Green (11)', FECHA: d(11), CLASIFICACION: 'AA', DIAS: '11', ESTATUS: 'PENDING' },
                            { ID: '7', CONCEPTO: 'AA - Yellow (12)', FECHA: d(12), CLASIFICACION: 'AA', DIAS: '12', ESTATUS: 'PENDING' },
                            { ID: '8', CONCEPTO: 'AA - Red (16)', FECHA: d(16), CLASIFICACION: 'AA', DIAS: '16', ESTATUS: 'PENDING' }
                        ],
                        history: []
                    });
                },
                apiFetchCascadeTree: function() { if (this._success) this._success({success:true, data:[]}); },
                apiFetchDrafts: function() { if (this._success) this._success({success:true, data:[]}); }
            };

            window.google = {
                script: {
                    run: {
                        withSuccessHandler: function(cb) {
                            const obj = Object.create(runner);
                            obj._success = cb;
                            obj.withFailureHandler = function(errCb) {
                                this._failure = errCb;
                                return this;
                            };
                            return obj;
                        },
                        apiLogout: function() {}
                    }
                }
            };
        """)

        print("Logging in...")
        page.fill("input[placeholder='Usuario']", "ADMIN")
        page.fill("input[placeholder='Contraseña...']", "admin")
        page.click("button:has-text('INICIAR SESIÓN')")

        print("Waiting for dashboard...")
        try:
            page.wait_for_selector(".dept-card", timeout=10000)
            print("Dashboard loaded.")
        except:
            print("Dashboard timeout. Taking screenshot.")
            page.screenshot(path="verification/debug_dashboard_timeout_2.png")
            raise

        print("Navigating to department...")
        page.click(".dept-card:has-text('Construccion')")

        print("Navigating to staff...")
        page.wait_for_selector(".staff-card")
        page.click(".staff-card:has-text('TEST_USER')")

        print("Waiting for table...")
        page.wait_for_selector(".table-excel")

        # Give some time for rendering
        time.sleep(1)

        # Take screenshot
        page.screenshot(path="verification/verification_traffic_light.png")
        print("Screenshot saved to verification/verification_traffic_light.png")

        browser.close()

if __name__ == "__main__":
    verify_traffic_light()
