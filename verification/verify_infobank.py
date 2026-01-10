
import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Subscribe to console logs
        page.on('console', lambda msg: print(f'BROWSER CONSOLE: {msg.text}'))

        # Load via HTTP Server
        print('Navigating to index.html...')
        await page.goto('http://localhost:8000/index.html')

        # --- Mock window.google.script.run ---
        print('Injecting mock...')
        await page.evaluate("""
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
                            console.log('Mock apiLogin called for:', u);
                            if (this.successCallback) {
                                // Simulate async response
                                Promise.resolve().then(() => {
                                    console.log('Resolving apiLogin success...');
                                    this.successCallback({ success: true, name: 'Admin User', username: 'LUIS_CARLOS', role: 'ADMIN' });
                                });
                            }
                        },
                        getSystemConfig: function(role) {
                            console.log('Mock getSystemConfig called');
                            if (this.successCallback) {
                                Promise.resolve().then(() => {
                                    this.successCallback({
                                        departments: {},
                                        staff: [],
                                        directory: [],
                                        specialModules: [
                                            { id: 'INFO_BANK', label: 'Banco de Informacion', icon: 'fa-database', color: '#17a2b8', type: 'info_bank_view' }
                                        ],
                                        accessProjects: true
                                    });
                                });
                            }
                        },
                        apiFetchInfoBankData: function(year, month, company, folder) {
                            console.log('Fetching for:', year, month);
                            if (this.successCallback) this.successCallback({ success: true, data: [] });
                        },
                        apiFetchDrafts: function() { if (this.successCallback) this.successCallback({ success: true, data: [] }); },
                        apiFetchCascadeTree: function() { if (this.successCallback) this.successCallback({ success: true, data: [] }); },
                        apiFetchTeamKPIData: function(u) {
                             if (this.successCallback) this.successCallback({success: true, ventas: [], tracker: []});
                        }
                    }
                }
            };
            console.log('Mock injected. window.google:', window.google);
        """)

        # Login
        print('Filling login form...')
        await page.fill('input[placeholder="Usuario"]', 'LUIS_CARLOS')
        await page.fill('input[placeholder="Contraseña..."]', 'admin2025')
        print('Clicking login...')
        await page.click('button:has-text("INICIAR SESIÓN")')

        # Wait for dashboard
        print('Waiting for sidebar...')
        try:
            await page.wait_for_selector('.sidebar', timeout=10000)
            print('Sidebar found!')
        except Exception as e:
            print('Sidebar NOT found. Taking debug screenshot.')
            await page.screenshot(path='verification/debug_login_fail.png')
            raise e

        # Navigate to INFO BANK
        print('Navigating to Info Bank...')
        await page.click('div.nav-item:has-text("BANCO DE INFORMACION")')

        # Verify Year Selection View (Default)
        await page.wait_for_selector('h5:has-text("Selecciona el Año")')
        await page.screenshot(path='verification/step1_years.png')
        print('Step 1: Years View verified.')

        # Click 2025
        print('Clicking 2025...')
        await page.click('h5:has-text("2025")')

        # Verify Months View
        await page.wait_for_selector('h5:has-text("Selecciona el Mes - 2025")')
        await page.screenshot(path='verification/step2_months.png')
        print('Step 2: Months View verified.')

        # Click Octubre (Trigger Filter)
        print('Clicking Octubre...')
        await page.click('h5:has-text("Octubre")')

        # Verify Companies View (Filtered)
        await page.wait_for_selector('h5:has-text("Empresas - Octubre 2025")')

        # Print list content for debug
        items = await page.locator('.list-group-item span.fw-bold').all_text_contents()
        print('Items found:', items)

        # Check for presence of VERTIV and ALCOM
        vertiv = await page.is_visible('span:has-text("VERTIV")')
        alcom = await page.is_visible('span:has-text("ALCOM")')

        if vertiv and alcom:
            print('SUCCESS: VERTIV and ALCOM found in filtered list.')
        else:
            print(f'FAILURE: VERTIV={vertiv}, ALCOM={alcom}')

        # Take screenshot of filtered list
        await page.screenshot(path='verification/step3_filtered_companies.png')

        await browser.close()

if __name__ == '__main__':
    asyncio.run(run())
