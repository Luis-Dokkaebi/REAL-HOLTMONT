from playwright.sync_api import sync_playwright, expect
import os

# Get current directory
current_dir = os.getcwd()

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Load local index.html
        page.goto(f"file://{current_dir}/index.html")

        # Mock window.google.script.run. Wrap in ()
        page.evaluate("""() => {
            function createRunner(successCb, failureCb) {
                return {
                    withSuccessHandler: function(cb) { return createRunner(cb, failureCb); },
                    withFailureHandler: function(cb) { return createRunner(successCb, cb); },
                    apiLogin: function(u, p) {
                        if(successCb) successCb({ success: true, name: 'TEST_USER', username: 'TEST_USER', role: 'ADMIN' });
                    },
                    getSystemConfig: function(r) {
                        if(successCb) successCb({
                            departments: { 'DEPTO': { label: 'Departamento Test', color: '#ff0000', icon: 'fa-cube' } },
                            staff: [{ name: 'TEST_USER', dept: 'DEPTO' }],
                            directory: [],
                            specialModules: [],
                            accessProjects: true
                        });
                    },
                    apiFetchStaffTrackerData: function(sheet) {
                         if(successCb) successCb({
                            success: true,
                            data: [],
                            headers: ['ID', 'CONCEPTO', 'DIAS', 'ESTATUS'],
                            history: []
                         });
                    },
                    apiUpdateTask: function(sheet, row, user) {
                        if(successCb) successCb({ success: true });
                    },
                    apiFetchDrafts: function() { if(successCb) successCb({ success: true, data: [] }); },
                    apiFetchCascadeTree: function() { if(successCb) successCb({ success: true, data: [] }); },
                    apiFetchTeamKPIData: function() { if(successCb) successCb({ success: true, ventas:[], tracker:[] }); },
                    apiLogout: function() {},
                };
            }
            window.google = { script: { run: createRunner() } };
        }""")

        # Login
        page.fill('input[placeholder="Usuario"]', 'TEST_USER')
        page.fill('input[placeholder="Contraseña..."]', 'pass')
        page.click('button:has-text("INICIAR SESIÓN")')

        # Wait for dashboard
        page.wait_for_selector('.dept-card')

        # Go to Staff Tracker
        page.click('.dept-card')
        # Click on staff card
        page.wait_for_selector('.staff-card')
        page.click('.staff-card')

        # Wait for tracker table
        page.wait_for_selector('.table-excel')

        # Add New Row
        page.click('button[title="Agregar"]')

        # Wait for pulse effect to start
        page.wait_for_timeout(200)

        # Take screenshot
        page.screenshot(path="verification/verification_pulse.png")

        browser.close()

if __name__ == "__main__":
    run_verification()
