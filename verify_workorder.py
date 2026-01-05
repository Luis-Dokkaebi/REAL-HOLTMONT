
import asyncio
from playwright.async_api import async_playwright
import json
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
        page = await browser.new_page()

        # Mock google.script.run
        await page.add_init_script("""
            window.google = {
                script: {
                    run: {
                        withSuccessHandler: function(callback) {
                            this.successCallback = callback;
                            return this;
                        },
                        withFailureHandler: function(callback) {
                            this.failureCallback = callback;
                            return this;
                        },
                        apiLogin: function(u, p) {
                            if (this.successCallback) {
                                this.successCallback({
                                    success: true,
                                    name: 'PREWORK',
                                    username: 'PREWORK_ORDER',
                                    role: 'WORKORDER_USER'
                                });
                            }
                        },
                        getSystemConfig: function(role) {
                            if (this.successCallback) {
                                this.successCallback({
                                    departments: {'ELECTROMECANICA': {label: 'Electromecánica', color: '#000'}},
                                    staff: [],
                                    directory: [{name: 'Test User', dept: 'VENTAS'}],
                                    specialModules: [
                                        {id: 'PPC_MASTER', label: 'Work Order', icon: 'fa-clipboard-list', color: '#0d6efd', type: 'ppc_native'}
                                    ]
                                });
                            }
                        },
                        apiGetNextWorkOrderSeq: function() {
                            if (this.successCallback) this.successCallback('1000');
                        },
                        apiFetchPPCData: function() {
                             if (this.successCallback) this.successCallback({success: true, data: []});
                        },
                        apiFetchDrafts: function() {
                             if (this.successCallback) this.successCallback({success: true, data: []});
                        },
                        apiFetchCascadeTree: function() {
                            if (this.successCallback) this.successCallback({success: true, data: []});
                        },
                        apiFetchTeamKPIData: function(u) {
                             if (this.successCallback) this.successCallback({success: true, ventas: [], tracker: []});
                        },
                        apiFetchSalesHistory: function() {
                             if (this.successCallback) this.successCallback({success: true, data: {}});
                        }
                    }
                }
            };
        """)

        try:
            # Check if server is up
            response = await page.goto("http://localhost:8000/index.html")
            print(f"Page loaded: {response.status}")

            # Login
            await page.fill("input[placeholder='Usuario']", "PREWORK_ORDER")
            await page.fill("input[placeholder='Contraseña...']", "password")
            await page.click("button:has-text('INICIAR SESIÓN')")

            # Wait for sidebar and module
            await page.wait_for_selector(".dept-card", timeout=5000)
            print("Logged in")

            # Click on Work Order module
            await page.click(".dept-card")
            print("Opened module")

            # Wait for cost card to appear (indicates our changes are present)
            await page.wait_for_selector(".cost-card", timeout=5000)
            print("Cost cards found")

            # Scroll to the cost card area
            await page.locator(".cost-card").first.scroll_into_view_if_needed()

            # Wait a bit for animations
            await page.wait_for_timeout(500)

            # Take screenshot of the viewport (which should now show the costs)
            await page.screenshot(path="verification_screenshot_costs.png")
            print("Screenshot saved to verification_screenshot_costs.png")

            # Also try to capture the footer
            await page.locator(".footer-summary-container").scroll_into_view_if_needed()
            await page.wait_for_timeout(500)
            await page.screenshot(path="verification_screenshot_footer.png")
            print("Screenshot saved to verification_screenshot_footer.png")

        except Exception as e:
            print(f"Error: {e}")
            await page.screenshot(path="error_screenshot.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
