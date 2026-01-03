import os
from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()

        # Inject mock for google.script.run
        context.add_init_script("""
            window.google = {
              script: {
                run: {
                  withSuccessHandler: function(s) {
                    this._s = s;
                    return this;
                  },
                  withFailureHandler: function(f) {
                    this._f = f;
                    return this;
                  },
                  apiLogin: function(u, p) {
                    if (this._s) this._s({ success: true, name: 'Test User', username: 'PREWORK_ORDER', role: 'WORKORDER_USER' });
                  },
                  getSystemConfig: function(r) {
                     if (this._s) this._s({
                         departments: {'DEP': {label: 'Departamento Test', color: 'blue', icon: 'fa-cog'}},
                         staff: [],
                         directory: [{name: 'Test User', dept: 'DEP'}],
                         specialModules: [{id: 'PPC_MASTER', type: 'ppc_native', label: 'Work Order', icon: 'fa-file', color: 'red'}]
                     });
                  },
                  apiGetNextWorkOrderSeq: function() {
                     if (this._s) this._s('0001');
                  },
                  apiSavePPCData: function(data) {
                     if (this._s) this._s({ success: true, ids: ['TEST-FOLIO'] });
                  },
                  apiSyncDrafts: function() {},
                  apiClearDrafts: function() {},
                  apiLogout: function() {},
                  // Catch all for any other calls to prevent crash
                  apiFetchDrafts: function() {},
                  apiFetchTeamKPIData: function() {},
                  apiFetchSalesHistory: function() {},
                  apiFetchWeeklyPlanData: function() {},
                  apiFetchCascadeTree: function() {},
                }
              }
            };
        """)

        page = context.new_page()
        # Load local file
        page.goto(f"file://{os.getcwd()}/index.html")

        # 1. Login
        page.fill("input[placeholder='Usuario']", "PREWORK_ORDER")
        page.fill("input[placeholder='Contraseña...']", "password")
        page.click("button:has-text('INICIAR SESIÓN')")

        # Wait for dashboard (sidebar should appear)
        page.wait_for_selector(".sidebar")

        # 2. Navigate to WorkOrder (click the module)
        page.click("text=Work Order")

        # Wait for WorkOrder form
        page.wait_for_selector("text=PROGRAMA DEL PROYECTO")

        # 3. Test "PROGRAMA DEL PROYECTO"
        # Click Add
        page.click("div.card-header:has-text('PROGRAMA DEL PROYECTO') button:has-text('Agregar')")
        # Fill row
        # Locator for last row in project program
        last_row = page.locator("div.card-body.bg-light > div.card").last
        last_row.locator("input[placeholder='Descripción']").fill("Actividad de Prueba")
        last_row.locator("input[type='date']").fill("2026-01-05")
        last_row.locator("input[placeholder='T']").fill("5")
        last_row.locator("input[placeholder='Cant']").fill("10")
        last_row.locator("input[placeholder='P.U.']").fill("100")

        # Click somewhere else to trigger blur/update if needed, though Vue model updates on input
        page.click("text=PROGRAMA DEL PROYECTO")

        # Check Total (should be 1000)
        # We need to wait a bit for Vue to update DOM
        page.wait_for_timeout(500)
        total_val = last_row.locator("input[placeholder='Total']").input_value()
        print(f"Project Row Total: {total_val}")
        if "$1,000.00" not in total_val and "1000" not in total_val:
             print("Warning: Total calculation might be wrong or formatting issue.")

        # 4. Test "MATERIALES REQUERIDOS"
        # Click Add
        page.click("div.card-header:has-text('MATERIALES REQUERIDOS') button:has-text('Agregar')")
        # Fill row in table
        last_mat_row = page.locator("div.card:has-text('MATERIALES REQUERIDOS') tbody tr").last
        last_mat_row.locator("input[placeholder='0']").first.fill("5") # Quantity
        last_mat_row.locator("input[placeholder='0.00']").fill("50") # Cost

        page.click("text=MATERIALES REQUERIDOS")
        page.wait_for_timeout(500)

        mat_total = last_mat_row.locator("td.fw-bold.text-end").inner_text()
        print(f"Material Row Total: {mat_total}")

        # Scroll to view both sections
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")

        # Screenshot
        page.screenshot(path="verification_screenshot.png")
        print("Screenshot saved to verification_screenshot.png")

        browser.close()

if __name__ == "__main__":
    verify_frontend()
