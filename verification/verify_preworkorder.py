from playwright.sync_api import sync_playwright
import os
import time

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()

    cwd = os.getcwd()
    # We assume index.html exists (copied from index,html)
    page.goto(f"file://{cwd}/index.html")

    # Mock Google Apps Script environment
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
                            },
                            apiSavePPCData: function(payload) {
                                setTimeout(() => {
                                    successCallback({ success: true, ids: ['WO-TEST-123'] });
                                }, 500);
                            }
                        };
                    },
                    apiLogout: function() {}
                }
            }
        };
    """)

    # Login
    page.fill('input[placeholder="Usuario"]', 'PREWORK_ORDER')
    page.fill('input[placeholder="Contraseña..."]', 'anypass')
    page.click('button:has-text("INICIAR SESIÓN")')

    try:
        # Wait for Sidebar Item
        page.wait_for_selector('text=Pre Work Order', timeout=5000)
        page.click('text=Pre Work Order')

        # Wait for the main H3 header of the new design
        # "PRE WORK ORDER"
        page.wait_for_selector('h3:has-text("PRE WORK ORDER")', timeout=10000)

        # Interact with Type of Work buttons
        page.click('button:has-text("Construcción")')

        # Add an item line
        page.click('text=Agregar línea')

        # Wait for table inputs to appear
        page.wait_for_selector('table input[placeholder="m², ml, pza..."]', timeout=5000)

        # Fill table row
        # There are multiple inputs.
        # 1. Unidad (text)
        # 2. Cantidad (number)
        # 3. Precio (number)
        # 4. Utilidad (number)

        page.fill('table input[placeholder="m², ml, pza..."]', 'm2')

        inputs = page.locator('table input[type="number"]')
        # nth(0) -> Cantidad
        # nth(1) -> Precio
        # nth(2) -> Utilidad

        inputs.nth(0).fill('10')
        inputs.nth(1).fill('100')
        inputs.nth(2).fill('50')

        # Take verification screenshot
        page.screenshot(path="verification/pre_work_order.png", full_page=True)
        print("Screenshot taken successfully")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error_debug.png", full_page=True)
        print("Error screenshot taken")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
