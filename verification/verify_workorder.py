from playwright.sync_api import sync_playwright
import os

def run_v2():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 2000})
        page = context.new_page()

        page.add_init_script("""
            window.google = {
                script: {
                    run: {
                        withSuccessHandler: function(callback) {
                            var newObj = Object.create(this);
                            newObj._success = callback;
                            return newObj;
                        },
                        withFailureHandler: function(callback) {
                            var newObj = Object.create(this);
                            newObj._failure = callback;
                            return newObj;
                        },
                        apiLogin: function(u, p) {
                            if (this._success) {
                                this._success({
                                    success: true,
                                    name: 'PREWORK ORDER USER',
                                    username: 'PREWORK_ORDER',
                                    role: 'WORKORDER_USER'
                                });
                            }
                        },
                        getSystemConfig: function(role) {
                            if (this._success) {
                                this._success({
                                    departments: {},
                                    staff: [],
                                    directory: [
                                        { name: 'COTIZADOR 1', dept: 'VENTAS' },
                                        { name: 'COTIZADOR 2', dept: 'VENTAS' }
                                    ],
                                    specialModules: [
                                        { id: 'PPC_NATIVE', label: 'PRE WORK ORDER', type: 'ppc_native', icon: 'fa-clipboard-list', color: '#dc3545' }
                                    ]
                                });
                            }
                        },
                        apiGetNextWorkOrderSeq: function() {
                            if (this._success) this._success('0099');
                        },
                        apiFetchPPCData: function() {
                            if (this._success) this._success({ success: true, data: [] });
                        },
                        apiFetchCascadeTree: function() {
                            if (this._success) this._success({ success: true, data: [] });
                        },
                        apiFetchDrafts: function() {
                             if (this._success) this._success({ success: true, data: [] });
                        }
                    }
                }
            };
        """)

        page.goto(f"file://{os.path.abspath('index.html')}")
        page.fill("input[placeholder='Usuario']", "PREWORK_ORDER")
        page.fill("input[placeholder='Contraseña...']", "password")
        page.click("button:has-text('INICIAR SESIÓN')")

        try:
            if page.is_visible(".swal2-confirm"):
                print("Closing unexpected Swal alert...")
                page.click(".swal2-confirm")
        except:
            pass

        page.wait_for_selector("text=PRE WORK ORDER")
        page.click("text=PRE WORK ORDER", force=True)
        page.wait_for_selector("text=Información del Cliente")

        # 1. Verify Restricciones Logic Alert
        page.wait_for_selector("text=Lógica de restricciones:")
        print("Verified: Lógica de restricciones alert is present.")

        # 2. Verify Buttons Logic Alert
        page.wait_for_selector("text=Lógica de Botones:")
        print("Verified: Lógica de Botones alert is present.")

        # 3. Verify ChatGPT/Neuronal Logic
        page.wait_for_selector("text=Lógica: que nos ayude a realizar una minuta")
        page.wait_for_selector("text=Lógica: utilizar nuestro historial")
        print("Verified: ChatGPT/Red Neuronal logic texts are present.")

        # 4. Verify Project Program Responsable Column
        element = page.locator("text=PROGRAMA DEL PROYECTO")
        element.scroll_into_view_if_needed()

        # Corrected selector: Playwright does not support :has-option() in standard CSS unless it's a specific extension.
        # But we can use text matching.
        # Find a select that contains option with text "Responsable..."

        # Or just find the option directly and verify it is visible
        option_locator = page.locator("option:has-text('Responsable...')").first

        # Since options might be hidden inside select, checking existence is better.
        if option_locator.count() > 0:
             print("Verified: Responsable column exists (option found).")
        else:
             print("Failed: Responsable column not found.")

        # 5. Verify Mano de Obra Logic
        page.locator("text=MANO DE OBRA").first.scroll_into_view_if_needed()
        page.wait_for_selector("text=Lógica de las horas y sueldos:")
        print("Verified: Lógica de las horas y sueldos alert is present.")

        page.screenshot(path="verification/workorder_verified.png", full_page=True)
        print("Screenshot saved to verification/workorder_verified.png")

        browser.close()

if __name__ == "__main__":
    run_v2()
