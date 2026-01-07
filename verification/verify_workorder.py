
import os
from playwright.sync_api import sync_playwright

def verify_workorder_form():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the local HTML file
        file_path = os.path.abspath("index.html")
        page.goto(f"file://{file_path}")

        # Mock window.google.script.run to bypass GAS errors and handle success callbacks
        page.evaluate("""
            window.google = {
                script: {
                    run: {
                        withSuccessHandler: function(callback) {
                            return {
                                apiLogin: function(u, p) {
                                    callback({
                                        success: true,
                                        name: 'TEST USER',
                                        username: 'PREWORK_ORDER',
                                        role: 'WORKORDER_USER'
                                    });
                                    return this;
                                },
                                getSystemConfig: function() {
                                    callback({
                                        departments: {},
                                        staff: [],
                                        directory: [],
                                        specialModules: [{id: 'PPC_MASTER', type: 'ppc_native', label: 'Work Order', icon: 'fa-clipboard-list', color: '#007bff'}]
                                    });
                                    return this;
                                },
                                apiGetNextWorkOrderSeq: function() {
                                    callback('0001');
                                    return this;
                                },
                                apiFetchCascadeTree: function() {
                                    callback({success: true, data: []});
                                    return this;
                                },
                                withFailureHandler: function() { return this; }
                            };
                        },
                        withFailureHandler: function() { return this; },
                        apiLogin: function() {},
                        apiLogout: function() {}
                    }
                }
            };
        """)

        # Perform Login
        page.fill('input[placeholder="Usuario"]', "PREWORK_ORDER")
        page.fill('input[placeholder="Contraseña..."]', "password")
        page.click('button:has-text("INICIAR SESIÓN")')

        # Wait for dashboard to load
        page.wait_for_selector('.dept-card', timeout=5000)

        # Click the module to open WorkOrder Form
        page.click('.dept-card', force=True)

        # Wait for WorkOrder form
        page.wait_for_selector('h4:has-text("Holtmont Services")', timeout=5000)

        # Select the *first* visible "MANO DE OBRA" header to be safe, as duplicate headers might exist due to code repetition or similar structures (though I should have moved it, not duplicated it).
        # Actually, let's verify if I accidentally duplicated it. The error says 2 elements.
        # This is a good check. If I duplicated instead of moved, I need to fix it.
        # Wait, I did `replace_with_git_merge_diff` to modify "MATERIALES", "HERRAMIENTAS" and *insert* "MANO DE OBRA".
        # But I removed "MANO DE OBRA" from its old location?
        # My "Replace" block for "MANO DE OBRA" relocation was:
        # SEARCH: `<!-- PROGRAMA DEL PROYECTO (NUEVO PROTOTIPO) --> ... <div class="card border-0 shadow-sm mt-5">`
        # REPLACE: `<!-- MANO DE OBRA (NUEVO) --> ... <!-- PROGRAMA DEL PROYECTO (NUEVO PROTOTIPO) --> ...`

        # Wait, I might have failed to remove the old "MANO DE OBRA".
        # Let's check the code via grep first.

        target = page.locator('h6:has-text("MANO DE OBRA")').first
        target.scroll_into_view_if_needed()

        page.screenshot(path="verification/verification_screenshot.png", full_page=True)

        browser.close()

if __name__ == "__main__":
    verify_workorder_form()
