
import os
import sys
from playwright.sync_api import sync_playwright

# Ensure we have the path to index.html
if not os.path.exists("index.html"):
    print("Error: index.html not found")
    sys.exit(1)

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the page
        page.goto(f"file://{os.path.abspath('index.html')}")

        # Mock google.script.run
        page.evaluate("""
            window.google = {
                script: {
                    run: {
                        withSuccessHandler: function(callback) {
                            this._success = callback;
                            return this;
                        },
                        withFailureHandler: function(callback) {
                            this._failure = callback;
                            return this;
                        },
                        apiLogin: function(user, pass) {
                            if (user === 'LUIS_CARLOS' && pass === 'admin') {
                                this._success({
                                    success: true,
                                    name: 'Luis Carlos',
                                    username: 'LUIS_CARLOS',
                                    role: 'ADMIN'
                                });
                            } else {
                                if(this._failure) this._failure({message: 'Invalid credentials'});
                            }
                        },
                        getSystemConfig: function(role) {
                            this._success({
                                departments: {},
                                staff: [],
                                directory: [],
                                specialModules: []
                            });
                        },
                        apiFetchDrafts: function() {
                            this._success({success: true, data: []});
                        },
                        apiFetchTeamKPIData: function(user) {
                            this._success({success: true, ventas: [], tracker: [], productivity: null});
                        },
                        apiFetchCascadeTree: function() {
                            this._success({success: true, data: []});
                        },
                        apiLogout: function() {
                             console.log("Logout called");
                        }
                    }
                }
            };
        """)

        # Perform Login
        print("Logging in as LUIS_CARLOS...")
        page.fill('input[placeholder="Usuario"]', 'LUIS_CARLOS')
        page.fill('input[placeholder="Contraseña..."]', 'admin')
        page.click('button:has-text("INICIAR SESIÓN")')

        # Wait for dashboard
        page.wait_for_selector('.brand-text', timeout=5000)
        print("Login successful.")

        # Check for BANCO DE INFORMACION sidebar item
        print("Checking for BANCO DE INFORMACION sidebar item...")
        sidebar_item = page.locator('.nav-item:has-text("BANCO DE INFORMACION")')
        if sidebar_item.is_visible():
            print("Sidebar item found.")
        else:
            print("Error: Sidebar item NOT found.")
            sys.exit(1)

        # Click the item
        sidebar_item.click()

        # Verify View Title
        page.wait_for_selector('h4:has-text("BANCO DE INFORMACION")')
        print("Info Bank View Loaded.")

        # Verify Years
        print("Checking Year Selection...")
        if page.locator('h2:has-text("2026")').is_visible():
            print("Year '2026' found.")
        else:
            print("Error: Year '2026' not found.")
            sys.exit(1)

        # Click 2026
        page.click('h2:has-text("2026")')

        # Verify Months
        print("Checking Month Buttons...")
        page.wait_for_selector('h5:has-text("Meses del Año 2026")')
        if page.locator('h5:has-text("Enero")').is_visible():
            print("Month 'Enero' found.")
        else:
            print("Error: Month 'Enero' not found.")
            sys.exit(1)

        # Click Enero
        page.click('h5:has-text("Enero")')

        # Verify Companies
        print("Checking Company List...")
        page.wait_for_selector('h5:has-text("Empresas - Enero 2026")')

        company = page.locator('span:has-text("DANFOSS MTY")')
        if company.is_visible():
            print("Company 'DANFOSS MTY' found.")
        else:
            print("Error: Company 'DANFOSS MTY' not found.")
            sys.exit(1)

        # Click Company
        company.click()

        # Verify Folders
        print("Checking Folders...")
        page.wait_for_selector('h5:has-text("DANFOSS MTY - Carpetas")')

        folder = page.locator('h6:has-text("SCOPE")')
        if folder.is_visible():
            print("Folder 'SCOPE' found.")
        else:
            print("Error: Folder 'SCOPE' not found.")
            sys.exit(1)

        folder_cot = page.locator('h6:has-text("COTIZACIÓN ENVIADA AL CLIENTE")')
        if folder_cot.is_visible():
            print("Folder 'COTIZACIÓN ENVIADA AL CLIENTE' found.")
        else:
            print("Error: Folder 'COTIZACIÓN ENVIADA AL CLIENTE' not found.")
            sys.exit(1)

        # Test Navigation Back
        print("Testing Back Navigation...")
        page.click('button:has-text("Volver")')
        page.wait_for_selector('h5:has-text("Empresas - Enero 2026")')
        print("Returned to Companies list.")

        page.click('button:has-text("Volver")')
        page.wait_for_selector('h5:has-text("Meses del Año 2026")')
        print("Returned to Months list.")

        page.click('button:has-text("Volver")')
        page.wait_for_selector('h5:has-text("Selecciona el Año")')
        print("Returned to Years list.")

        # Re-navigate to a view for screenshot (Use 2026 this time)
        page.click('h2:has-text("2026")')
        page.click('h5:has-text("Enero")')
        page.click('span:has-text("DANFOSS MTY")')
        page.wait_for_selector('h5:has-text("DANFOSS MTY - Carpetas")')

        page.screenshot(path="verification/info_bank_verification.png")
        print("Screenshot saved to verification/info_bank_verification.png")

        print("Verification Successful!")
        browser.close()

if __name__ == "__main__":
    run_verification()
