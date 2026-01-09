import os
import time
from playwright.sync_api import sync_playwright

def verify_order():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load local HTML file
        page.goto(f"file://{os.getcwd()}/index.html")

        # Inject Mock Backend
        page.evaluate("""
            window.google = {
                script: {
                    run: {
                        withSuccessHandler: function(callback) {
                            var api = {
                                apiLogin: function(u, p) {
                                    setTimeout(() => {
                                        callback({
                                            success: true,
                                            name: 'TEST USER',
                                            username: 'PREWORK_ORDER',
                                            role: 'WORKORDER_USER'
                                        });
                                    }, 100);
                                    return api;
                                },
                                getSystemConfig: function() {
                                    setTimeout(() => {
                                        callback({
                                            departments: {'DEP1': {label: 'DEP1', color: 'red', icon: 'fa-cube'}},
                                            staff: [],
                                            directory: [],
                                            specialModules: [{id: 'PPC_MASTER', label: 'Workorder', type: 'ppc_native', color: 'blue', icon: 'fa-tasks'}]
                                        });
                                    }, 100);
                                    return api;
                                },
                                apiGetNextWorkOrderSeq: function() { callback('0001'); return api; },
                                apiFetchPPCData: function() { callback({success: true, data: []}); return api; },
                                apiFetchDrafts: function() { callback({success: true, data: []}); return api; },
                                uploadFileToDrive: function() { callback({success: true, fileUrl: 'mock_url'}); return api; },
                                apiSavePPCData: function() { callback({success: true}); return api; }
                            };
                            return api;
                        },
                        withFailureHandler: function() { return this; },
                        apiLogin: function() {},
                        apiLogout: function() {}
                    }
                }
            };
        """)

        # Perform Login
        page.fill('input[placeholder="Usuario"]', 'PREWORK_ORDER')
        page.fill('input[placeholder="Contraseña..."]', '1234')
        page.click('button:has-text("INICIAR SESIÓN")')

        # Wait for Dashboard (Dept card or Special Module)
        # Increase timeout
        try:
            page.wait_for_selector('.dept-card', timeout=5000)
            page.click('.dept-card:has-text("Workorder")')
        except:
             print("Dashboard load failed or timed out. Trying to force state.")
             # app is not global, it's inside Vue. But `app` variable in my script was `const app = createApp(...)`.
             # `app.mount('#app')` returns the root component instance.
             # I need to access the root component instance.
             # Usually Vue exposes it on the mount return.
             # The script has: `const app = createApp(...); app.mount('#app');`
             # It does not assign the mounted instance to a global var.
             # I have to rely on UI interaction.
             pass


        # Wait for Workorder View
        # Increase timeout drastically for debugging
        try:
            page.wait_for_selector('h4:has-text("Holtmont Services")', timeout=10000)
        except Exception as e:
            print("Failed to find Workorder Header.")
            page.screenshot(path="verification/failed_state.png")
            raise e

        # ---------------------------------------------------------
        # VERIFICATION STEPS
        # ---------------------------------------------------------

        # 1. Order Check
        # We check the vertical position (y) of elements to verify order.

        selectors = {
            "Tools": 'h6:has-text("HERRAMIENTAS REQUERIDAS")',
            "Labor": 'h6:has-text("MANO DE OBRA")',
            "Materials": 'h6:has-text("MATERIALES REQUERIDOS")',
            "Design": 'h6:has-text("DISEÑO / MAQUINADOS / DIBUJOS")',
            "Equip": 'h6:has-text("EQUIPOS ESPECIALES Y ACCESORIOS")',
            "Insumos": 'h6:has-text("INSUMOS")',
            "Transporte": 'h6:has-text("TRANSPORTE DE EQUIPO Y PERSONAL")',
            "Docs": 'h6:has-text("DOCUMENTACIÓN Y HERRAMIENTAS")',
            "Vehicle2": 'h6:has-text("CONTROL DE VEHICULO FINAL")'
        }

        positions = {}
        for name, sel in selectors.items():
            loc = page.locator(sel)
            if loc.count() > 0:
                box = loc.first.bounding_box()
                if box:
                    positions[name] = box['y']
                    print(f"Found {name} at Y={box['y']}")
            else:
                print(f"Warning: {name} not found")

        # Verify Order logic
        ordered_keys = ["Tools", "Labor", "Materials", "Design", "Equip", "Insumos", "Transporte", "Docs", "Vehicle2"]
        # Filter found only
        found_keys = [k for k in ordered_keys if k in positions]
        sorted_found = sorted(found_keys, key=lambda k: positions[k])

        print("Expected Order:", found_keys)
        print("Actual Order:  ", sorted_found)

        # Screenshots
        for name, sel in selectors.items():
            loc = page.locator(sel)
            if loc.count() > 0:
                loc.first.scroll_into_view_if_needed()
                time.sleep(0.2)
                page.screenshot(path=f"verification/section_{name}.png")

        browser.close()

if __name__ == "__main__":
    verify_order()
