
import asyncio
from playwright.async_api import async_playwright
import json
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
        page = await browser.new_page()
        # Set a large viewport height to capture more content
        await page.set_viewport_size({"width": 1280, "height": 2000})

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

            # Wait for content to appear
            await page.wait_for_selector("text=Check list", timeout=5000)
            print("Check list found")

            # Scroll to top
            await page.evaluate("window.scrollTo(0, 0)")
            await page.wait_for_timeout(1000)

            # Take screenshot of the top section (Checklist, Vehicle, Header)
            await page.screenshot(path="verification/verification_layout.png")
            print("Screenshot saved to verification/verification_layout.png")

        except Exception as e:
            print(f"Error: {e}")
            await page.screenshot(path="verification/error_screenshot.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
