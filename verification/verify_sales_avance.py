from playwright.sync_api import sync_playwright
import os

def verify_sales_avance(page):
    # Mock Google Script Run BEFORE page loads
    # Using 'this' context in python string might be tricky if not careful with JS
    page.add_init_script("""
        window.google = {
            script: {
                run: {
                    withSuccessHandler: function(callback) {
                        // Return a new object that includes methods AND failure handler capability
                        var runner = {
                            _success: callback,
                            withFailureHandler: function(failCallback) {
                                this._failure = failCallback;
                                return this;
                            },
                            apiLogin: function(u, p) {
                                var self = this;
                                setTimeout(function() {
                                    if(self._success) self._success({ success: true, role: "TONITA", name: "ANTONIA_VENTAS", username: "ANTONIA_VENTAS" });
                                }, 50);
                            },
                            getSystemConfig: function(r) {
                                var self = this;
                                setTimeout(function() {
                                    if(self._success) self._success({
                                        departments: { "VENTAS": { label: "Ventas", icon: "fa-handshake", color: "#0dcaf0" } },
                                        allDepartments: { "VENTAS": { label: "Ventas" } },
                                        staff: [{ name: "ANTONIA_VENTAS", dept: "VENTAS" }],
                                        directory: [{ name: "ANTONIA_VENTAS", dept: "VENTAS" }],
                                        specialModules: []
                                    });
                                }, 50);
                            },
                            apiFetchStaffTrackerData: function(name) {
                                var self = this;
                                setTimeout(function() {
                                    if(self._success) self._success({
                                        success: true,
                                        data: [
                                            { "ID": "1", "CLIENTE": "TEST", "AVANCE": "50%", "F2": "", "COTIZACION": "", "TIMEOUT": "", "LAYOUT": "", "CLASIFICACION": "A", "FECHA": "10/10/2023" }
                                        ],
                                        headers: ["ID", "CLIENTE", "AVANCE", "F2", "COTIZACION", "TIMEOUT", "LAYOUT", "CLASIFICACION", "FECHA", "DIAS"],
                                        history: []
                                    });
                                }, 50);
                            },
                            apiFetchTeamKPIData: function() {
                                var self = this;
                                setTimeout(function() { if(self._success) self._success({ success: true, ventas: [], tracker: [] }); }, 50);
                            },
                            apiFetchDrafts: function() {
                                var self = this;
                                setTimeout(function() { if(self._success) self._success({ success: true, data: [] }); }, 50);
                            },
                            apiFetchCascadeTree: function() {
                                var self = this;
                                setTimeout(function() { if(self._success) self._success({ success: true, data: [] }); }, 50);
                            },
                            apiUpdateTask: function(sheet, row, user) {
                                var self = this;
                                setTimeout(function() { if(self._success) self._success({ success: true }); }, 50);
                            }
                        };
                        return runner;
                    },
                    withFailureHandler: function(callback) {
                        // This handles the case where withFailureHandler is called first
                        var runner = {
                            _failure: callback,
                            withSuccessHandler: function(successCallback) {
                                this._success = successCallback;
                                return this;
                            },
                            // ... methods (duplicated or shared prototype) ...
                            // Ideally use a factory or prototype but this is a mock
                            apiLogin: function(u, p) { /* ... */ }
                        };
                        // For simplicity in this specific test flow (usually success first), we focus on the first path
                        return this.withSuccessHandler(null).withFailureHandler(callback);
                    }
                }
            }
        };
    """)

    page.goto(f"file://{os.getcwd()}/index.html")

    # Login
    page.fill("input[placeholder='Usuario']", "ANTONIA_VENTAS")
    page.fill("input[placeholder='Contraseña...']", "dummy")
    page.click("button:has-text('INICIAR SESIÓN')")

    # Wait for dashboard
    page.wait_for_selector(".dept-card", timeout=5000)

    # Navigate to Dept view then Tracker
    page.click(".dept-card")

    page.wait_for_selector(".staff-card", timeout=5000)
    page.click(".staff-card")

    # Wait for tracker table
    page.wait_for_selector(".table-excel", timeout=5000)

    # Find AVANCE input by checking 3rd column (index 2 in data array, likely 3rd or 4th in UI)
    # The header mock is ["ID", "CLIENTE", "AVANCE", ...]
    # So AVANCE is likely 3rd column.
    # The template renders:
    # <td v-for="(h, idx) in staffTracker.headers" ...>
    # So it should be 3rd TD (after row-num).

    # Let's inspect the page content to debug selector
    # page.screenshot(path="verification/debug_table.png")

    # Using generic input in 3rd data cell
    # tr:nth-child(1) is the first data row
    # td:nth-child(4) is the 3rd data column (1st is row num)

    avance_input = page.locator("table.table-excel tbody tr:first-child td:nth-child(4) input")

    if not avance_input.is_visible():
        raise Exception("AVANCE input not found in expected column")

    # Verify it is not readonly
    is_readonly = avance_input.get_attribute("readonly")
    if is_readonly is not None and is_readonly != "":
        raise Exception(f"AVANCE input is readonly! Attribute value: {is_readonly}")

    # Verify we can type in it
    avance_input.fill("80%")

    # Verify value changed
    val = avance_input.input_value()
    if val != "80%":
        raise Exception(f"Failed to update AVANCE input. Value is {val}")

    print("Success: AVANCE input is editable.")

    # Take screenshot
    page.screenshot(path="verification/sales_avance_manual.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_sales_avance(page)
            print("Verification successful")
        except Exception as e:
            print(f"Verification failed: {e}")
        finally:
            browser.close()
