from playwright.sync_api import sync_playwright
import os

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()

    # Mock window.google.script.run
    page.add_init_script("""
    window.google = {
        script: {
            run: {
                withSuccessHandler: function(callback) {
                    return {
                        withFailureHandler: function(errCallback) {
                            return {
                                apiLogin: function(u, p) {
                                    if (u === 'PREWORK_ORDER') {
                                        callback({
                                            success: true,
                                            name: 'PREWORK_ORDER',
                                            username: 'PREWORK_ORDER',
                                            role: 'WORKORDER_USER'
                                        });
                                    } else {
                                        errCallback({message: 'Invalid credentials'});
                                    }
                                },
                                apiGetNextWorkOrderSeq: function() {
                                    callback('0001');
                                },
                                getSystemConfig: function(role) {
                                    callback({
                                        departments: { 'DEP1': { label: 'Depto 1', color: 'red' } },
                                        staff: [],
                                        directory: [],
                                        specialModules: [{id: 'PPC_MASTER', type: 'ppc_native', label: 'Workorder', icon: 'fa-tasks', color: 'blue'}],
                                        accessProjects: false
                                    });
                                },
                                apiFetchCascadeTree: function() {
                                    callback({success: true, data: []});
                                }
                            };
                        },
                        apiGetNextWorkOrderSeq: function() {
                            callback('0001');
                            return this;
                        },
                        getSystemConfig: function(role) {
                            callback({
                                departments: { 'DEP1': { label: 'Depto 1', color: 'red' } },
                                staff: [],
                                directory: [],
                                specialModules: [{id: 'PPC_MASTER', type: 'ppc_native', label: 'Workorder', icon: 'fa-tasks', color: 'blue'}],
                                accessProjects: false
                            });
                            return this;
                        },
                        apiFetchCascadeTree: function() {
                            callback({success: true, data: []});
                            return this;
                        }
                    };
                },
                apiLogin: function(u, p) {
                    // This path might not be taken if withSuccessHandler is always used
                },
                apiFetchCascadeTree: function() {
                    // Direct call if any
                }
            }
        }
    };
    """)

    page.goto("http://localhost:8080/index.html")

    # Login as PREWORK_ORDER
    page.fill("input[placeholder='Usuario']", "PREWORK_ORDER")
    page.fill("input[placeholder='Contraseña...']", "123")
    page.click("button:has-text('INICIAR SESIÓN')")

    # Wait for Dashboard load
    page.wait_for_timeout(1000)

    # Click on "Workorder" module (simulating user click if not auto-redirected, though login handler usually redirects or user clicks)
    # The config mocks a specialModule 'Workorder'
    # Try to find the Workorder card/button
    # Check if we are already in WORKORDER_FORM (role WORKORDER_USER might default to it if coded?)
    # Looking at index.html: if (currentRole.value === 'WORKORDER_USER') ... fetchNextSequence() ... currentView.value = 'WORKORDER_FORM'.
    # Yes, `openModule` is called? No, `doLogin` calls `loadConfig`. `loadConfig` gets config.
    # It does NOT automatically switch view in `doLogin`.
    # BUT, `openModule` sets `currentView`.
    # Wait, `doLogin` -> `loadConfig` -> `apiFetchDrafts` (if admin).
    # It seems `currentView` defaults to `DASHBOARD`.
    # I need to click the Workorder module.

    try:
        page.click("text=Workorder")
    except:
        print("Could not find Workorder button, maybe already there or name differs?")

    page.wait_for_timeout(2000)

    # Take screenshot of the top part of the form
    page.screenshot(path="verification/verification_reorder.png", full_page=True)

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
