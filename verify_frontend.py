import os
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Mock google.script.run
    page.add_init_script("""
        window.google = {
            script: {
                run: {
                    withSuccessHandler: function(successCallback) {
                        const clone = Object.assign({}, this);
                        clone.successCallback = successCallback;
                        return clone;
                    },
                    withFailureHandler: function(failureCallback) {
                        const clone = Object.assign({}, this);
                        clone.failureCallback = failureCallback;
                        return clone;
                    },
                    apiLogin: function(u, p) {
                        setTimeout(() => {
                            if (this.successCallback) {
                                this.successCallback({
                                    success: true,
                                    name: 'Prework User',
                                    username: 'PREWORK_ORDER',
                                    role: 'WORKORDER_USER'
                                });
                            }
                        }, 100);
                    },
                    getSystemConfig: function(role) {
                        setTimeout(() => {
                            if (this.successCallback) {
                                this.successCallback({
                                    departments: { 'Electro': { label: 'Electromecánica', color: '#007bff', icon: 'fa-bolt' } },
                                    staff: [],
                                    directory: [{name: 'Test Staff', dept: 'Electro'}],
                                    specialModules: [
                                        { id: 'WORKORDER', label: 'Orden de Trabajo', type: 'ppc_native', icon: 'fa-clipboard-list', color: '#ff0000' }
                                    ],
                                    accessProjects: false
                                });
                            }
                        }, 100);
                    },
                    apiGetNextWorkOrderSeq: function() {
                        setTimeout(() => { if (this.successCallback) this.successCallback('1001'); }, 100);
                    },
                    apiFetchPPCData: function() {
                        setTimeout(() => { if (this.successCallback) this.successCallback({ success: true, data: [] }); }, 100);
                    },
                    apiLogout: function() {}
                }
            }
        };
    """)

    # Load local file
    cwd = os.getcwd()
    page.goto(f"file://{cwd}/index.html")

    # Login Flow
    page.fill("input[placeholder='Usuario']", "PREWORK_ORDER")
    page.fill("input[placeholder='Contraseña...']", "12345")
    page.click("button:has-text('INICIAR SESIÓN')")

    # Wait for Dashboard and Click Module
    page.wait_for_selector("text=Orden de Trabajo")
    page.click("text=Orden de Trabajo")

    # Wait for Workorder Form
    page.wait_for_selector(".content-wrapper")
    # Verify we are in WORKORDER_FORM view (check for Folio widget)
    page.wait_for_selector("text=FOLIO", timeout=5000)

    # Scroll to bottom to see Financing
    # The scrollable container is inside view-area > div
    # In my code: <div v-if="currentView === 'WORKORDER_FORM'" class="h-100 d-flex flex-column" style="overflow-y:auto;">
    # So we need to find that div and scroll it.

    # We can try scrolling the last div that has overflow-y auto
    page.evaluate("""
        const containers = document.querySelectorAll('div[style*="overflow-y:auto"]');
        if(containers.length > 0) {
            const container = containers[containers.length - 1];
            container.scrollTop = container.scrollHeight;
        }
    """)

    page.wait_for_timeout(1000)

    # Screenshot Light Mode
    page.screenshot(path="verification_light.png")
    print("Screenshot Light Mode taken.")

    # Toggle Theme -> Dark
    # Button in sidebar
    page.click("button[title*='Tema']")
    page.wait_for_timeout(500)
    page.screenshot(path="verification_dark.png")
    print("Screenshot Dark Mode taken.")

    # Toggle Theme -> Cyberpunk
    page.click("button[title*='Tema']")
    page.wait_for_timeout(500)
    page.screenshot(path="verification_cyberpunk.png")
    print("Screenshot Cyberpunk Mode taken.")

    browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
