from playwright.sync_api import sync_playwright
import os

def test_mobile_view():
    with sync_playwright() as p:
        # Launch browser in headless mode
        browser = p.chromium.launch(headless=True)

        # Emulate Pixel 5
        device = p.devices['Pixel 5']
        context = browser.new_context(**device)
        page = context.new_page()

        # Mock the Google Script environment
        page.add_init_script("""
            window.google = {
                script: {
                    run: {
                        withSuccessHandler: function(handler) {
                            return {
                                apiLogin: function(u, p) {
                                    setTimeout(() => {
                                        handler({
                                            success: true,
                                            name: 'Test User',
                                            username: 'TEST_USER',
                                            role: 'ADMIN'
                                        });
                                    }, 100);
                                    return { withFailureHandler: function() {} };
                                },
                                getSystemConfig: function() {
                                    setTimeout(() => {
                                        handler({
                                            departments: { 'TEST': { label: 'Test Dept', color: '#ff0000', icon: 'fa-flask' } },
                                            staff: [],
                                            directory: [],
                                            specialModules: []
                                        });
                                    }, 100);
                                },
                                apiFetchDrafts: function() {},
                                apiFetchCascadeTree: function() {
                                    setTimeout(() => {
                                        handler({ success: true, data: [] });
                                    }, 100);
                                }
                            };
                        },
                        apiLogout: function() {}
                    }
                }
            };
        """)

        # Load the local HTML file
        page.goto(f"file://{os.path.abspath('index.html')}")

        # Wait for Vue to mount
        page.wait_for_selector('#app')

        # 1. Login
        page.fill('input[placeholder="Usuario"]', 'TEST_USER')
        page.fill('input[placeholder="Contraseña..."]', 'pass')
        page.click('button:has-text("INICIAR SESIÓN")')

        # Wait for dashboard
        page.wait_for_selector('.app-wrapper')

        # 2. Verify Mobile Sidebar is hidden initially
        # Sidebar should be off-canvas (translateX < 0)
        sidebar = page.locator('.sidebar')
        # We can't easily check computed style transform in simple expect, but we can check visibility if logic hides it
        # Actually in my CSS I set transform: translateX(-110%)

        # 3. Click Toggle Button
        # In mobile view, the toggle button is in the brand section or top bar?
        # My CSS: .btn-toggle-sidebar { display: block !important; } inside media query.
        # It's inside .brand which is inside .sidebar?
        # Wait, if sidebar is hidden, .brand is hidden too?
        # No, sidebar is fixed left 0, top 0.
        # If transform is -110%, the whole sidebar including the toggle button inside it is hidden.
        # I made a mistake in the plan/implementation?
        # Let's check the HTML.
        # <div class="brand"> ... <button class="btn-toggle-sidebar"> ... </div>
        # This whole .brand is inside .sidebar.
        # So if .sidebar is off-screen, the toggle button is off-screen.
        # User cannot open the menu!

        # I need to fix this. I need a toggle button OUTSIDE the sidebar for mobile.
        # Or I need to verify if I added one. I didn't add a new button in HTML in my previous steps.
        # I only added CSS and JS logic.
        # I need to add a mobile toggle button in the .top-bar or somewhere visible.

        # Taking a screenshot to confirm this issue.
        page.screenshot(path='verification/mobile_issue.png')
        print("Screenshot taken: verification/mobile_issue.png")

        browser.close()

if __name__ == "__main__":
    test_mobile_view()
