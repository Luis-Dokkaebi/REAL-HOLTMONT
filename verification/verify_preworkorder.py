from playwright.sync_api import sync_playwright
import os
import time

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()

    cwd = os.getcwd()
    page.goto(f"file://{cwd}/index.html")

    page.evaluate("""
        window.google = {
            script: {
                run: {
                    withSuccessHandler: function(successCallback) {
                        return {
                            withFailureHandler: function(failureCallback) {
                                return {
                                    apiLogin: function(user, pass) {
                                        if (user === 'PREWORK_ORDER') {
                                            setTimeout(() => {
                                                successCallback({
                                                    success: true,
                                                    role: 'WORKORDER_USER',
                                                    name: 'Workorder User',
                                                    username: 'PREWORK_ORDER'
                                                });
                                            }, 100);
                                        } else {
                                            setTimeout(() => {
                                                successCallback({ success: false, message: 'Login failed' });
                                            }, 100);
                                        }
                                    }
                                };
                            },
                            getSystemConfig: function(role) {
                                setTimeout(() => {
                                    successCallback({
                                        departments: {},
                                        allDepartments: {
                                            'CONSTRUCCION': { label: 'Construcción', icon: 'fa-hard-hat', color: '#e83e8c' },
                                            'VENTAS': { label: 'Ventas', icon: 'fa-handshake', color: '#0dcaf0' }
                                        },
                                        staff: [],
                                        directory: [],
                                        specialModules: [{ id: "PPC_MASTER", label: "Pre Work Order", icon: "fa-tasks", color: "#fd7e14", type: "ppc_native" }],
                                        accessProjects: false
                                    });
                                }, 100);
                            },
                            apiFetchCascadeTree: function() {
                                successCallback({ success: true, data: [] });
                            }
                        };
                    },
                    apiLogout: function() {}
                }
            }
        };
    """)

    page.fill('input[placeholder="Usuario"]', 'PREWORK_ORDER')
    page.fill('input[placeholder="Contraseña..."]', 'anypass')
    page.click('button:has-text("INICIAR SESIÓN")')

    try:
        page.wait_for_selector('text=Pre Work Order', timeout=5000)
        page.click('text=Pre Work Order')
        page.wait_for_selector('h4:has-text("PRE WORK ORDER")', timeout=5000)

        # Click add line
        page.click('text=Agregar línea')

        # Wait for input
        page.wait_for_selector('table input[placeholder="m², ml, pza..."]', timeout=2000)

        page.fill('table input[placeholder="m², ml, pza..."]', 'm2')
        page.fill('table input[type="number"]', '10')
        # For the third input (Precio), we need to be specific as there are multiple number inputs in row
        # Row has: Unidad, Cantidad(number), Precio(number), Total(text), Utilidad(number), Subtotal(text)
        # 1st number input is Cantidad. 2nd number input is Precio. 3rd is Utilidad.

        inputs = page.locator('table input[type="number"]')
        inputs.nth(0).fill('10') # Cantidad
        inputs.nth(1).fill('100') # Precio
        inputs.nth(2).fill('50') # Utilidad

        page.screenshot(path="verification/pre_work_order.png", full_page=True)
        print("Screenshot taken")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error_debug.png", full_page=True)
        print("Error screenshot taken")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
