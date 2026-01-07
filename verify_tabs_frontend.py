
import os
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Load the local HTML file
    page.goto(f"file://{os.getcwd()}/index.html")

    # Inject mock for google.script.run
    page.evaluate("""
        window.google = {
            script: {
                run: {
                    withSuccessHandler: function(callback) {
                        return {
                            withFailureHandler: function(failCallback) {
                                return this;
                            },
                            apiLogin: function(u, p) {
                                callback({
                                    success: true,
                                    name: 'TEST USER',
                                    username: 'TEST_USER',
                                    role: 'ADMIN'
                                });
                            },
                            getSystemConfig: function() {
                                callback({
                                    departments: {
                                        'OPERATIVO': {label: 'OPERATIVO', color: '#3699ff', icon: 'fa-tools'}
                                    },
                                    staff: [{name: 'Juan Perez', dept: 'OPERATIVO'}],
                                    directory: [],
                                    specialModules: []
                                });
                            },
                            apiFetchStaffTrackerData: function(sheetName) {
                                callback({
                                    success: true,
                                    data: [
                                        {ID: '1', CONCEPTO: 'Tarea 1', DIAS: 0},
                                        {ID: '2', CONCEPTO: 'Tarea 2', DIAS: 5}
                                    ],
                                    history: [],
                                    headers: ['ID', 'CONCEPTO', 'DIAS']
                                });
                            },
                            apiFetchDrafts: function() { callback({success: true, data: []}); },
                            apiFetchCascadeTree: function() { callback({success: true, data: []}); },
                             apiFetchWeeklyPlanData: function() {
                                callback({success: true, data: [], headers: []});
                            },
                            apiFetchSalesHistory: function() {
                                callback({success: true, data: {}});
                            },
                            apiFetchTeamKPIData: function() {
                                callback({success: true, ventas: [], tracker: []});
                            }
                        };
                    },
                    withFailureHandler: function(callback) {
                        return this.withSuccessHandler(function(){});
                    },
                    apiLogout: function() {},
                    apiSyncDrafts: function() {}
                }
            }
        };
    """)

    # Login
    page.fill("input[placeholder='Usuario']", "admin")
    page.fill("input[placeholder='Contraseña...']", "admin")
    page.click("button:has-text('INICIAR SESIÓN')")

    # Wait for dashboard
    page.wait_for_selector(".brand-text")

    # Click on the department card
    page.click(".dept-card")

    # Wait for staff list (DEPT view)
    page.wait_for_selector(".staff-card")

    # Click on the staff card to open STAFF_TRACKER
    page.click(".staff-card")

    # Wait for STAFF_TRACKER view
    page.wait_for_selector(".tab-indicator")

    # Take screenshot of the initial state (OPERATIVO tab active)
    page.screenshot(path="verification_tabs_initial.png")

    # Click on VENTAS tab
    # We added ref="tabVentas", but playwright selects by DOM.
    # The text is "VENTAS" inside the div.
    page.click("text=VENTAS")

    # Wait a bit for animation
    page.wait_for_timeout(500)

    # Take screenshot of the second state (VENTAS tab active)
    page.screenshot(path="verification_tabs_switched.png")

    print("Frontend verification screenshots captured.")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
