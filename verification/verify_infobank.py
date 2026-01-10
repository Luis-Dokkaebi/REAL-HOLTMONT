
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
                                    name: 'Admin User',
                                    username: 'ADMIN',
                                    role: 'ADMIN'
                                });
                            }
                        },
                        getSystemConfig: function(role) {
                            if (this.successCallback) {
                                this.successCallback({
                                    departments: {},
                                    staff: [],
                                    directory: [],
                                    specialModules: []
                                });
                            }
                        },
                        apiFetchCascadeTree: function() {
                            if (this.successCallback) this.successCallback({success: true, data: []});
                        },
                        apiFetchDrafts: function() {
                             if (this.successCallback) this.successCallback({success: true, data: []});
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
            await page.fill("input[placeholder='Usuario']", "ADMIN")
            await page.fill("input[placeholder='Contraseña...']", "password")
            await page.click("button:has-text('INICIAR SESIÓN')")

            # Wait for sidebar
            await page.wait_for_selector(".sidebar", timeout=5000)
            print("Logged in")

            # Find and click "BANCO DE INFORMACION" in sidebar
            # It has text "BANCO DE INFORMACION"
            await page.click("text=BANCO DE INFORMACION")
            print("Clicked Banco de Informacion")

            # Wait for months view
            await page.wait_for_selector("text=Selecciona el Mes", timeout=5000)

            # Click "Enero"
            await page.click("text=Enero")
            print("Clicked Enero")

            # Wait for companies view
            await page.wait_for_selector("text=Empresas - Enero", timeout=5000)

            # Click first company (e.g. BSC)
            await page.click(".list-group-item")
            print("Clicked Company")

            # Wait for Folders view
            await page.wait_for_selector("text=Carpetas", timeout=5000)

            # Wait for animation
            await page.wait_for_timeout(1000)

            # Take screenshot
            await page.screenshot(path="verification/verification_infobank.png")
            print("Screenshot saved to verification/verification_infobank.png")

        except Exception as e:
            print(f"Error: {e}")
            await page.screenshot(path="verification/error_screenshot.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
