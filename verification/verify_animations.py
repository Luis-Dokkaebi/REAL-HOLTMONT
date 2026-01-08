from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load local HTML file
        page.goto('file://' + os.path.abspath('index.html'))

        # Wait for Vue to mount. Use .login-card as it is visible initially.
        page.wait_for_selector('.login-card')

        # MOCK google.script.run
        page.evaluate('''
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
                            // Mock success login for ADMIN
                            setTimeout(() => {
                                if(this.successCallback) this.successCallback({
                                    success: true,
                                    name: 'Admin User',
                                    username: 'ADMIN',
                                    role: 'ADMIN'
                                });
                            }, 500);
                        },
                        getSystemConfig: function(role) {
                            // Mock config
                            setTimeout(() => {
                                if(this.successCallback) this.successCallback({
                                    departments: { 'CONSTRUCCION': { label: 'Construcción', icon: 'fa-hard-hat', color: '#e83e8c' } },
                                    specialModules: [],
                                    staff: [],
                                    directory: []
                                });
                            }, 100);
                        },
                        apiFetchCascadeTree: function() {
                             // Mock tree
                             setTimeout(() => {
                                if(this.successCallback) this.successCallback({ success: true, data: [] });
                             }, 100);
                        },
                        apiFetchTeamKPIData: function(user) {
                             setTimeout(() => {
                                if(this.successCallback) this.successCallback({
                                    success: true,
                                    ventas: [],
                                    tracker: [],
                                    productivity: { labels: [], values: [] }
                                });
                             }, 100);
                        },
                        apiFetchDrafts: function() {
                             setTimeout(() => {
                                if(this.successCallback) this.successCallback({ success: true, data: [] });
                             }, 100);
                        }
                    }
                }
            };
        ''')

        # Perform Login to see Dashboard
        page.fill('input[placeholder="Usuario"]', 'LUIS_CARLOS')
        page.fill('input[placeholder="Contraseña..."]', 'admin2025')
        page.click('button:has-text("INICIAR SESIÓN")')

        # Wait for Dashboard
        page.wait_for_selector('.dept-card', timeout=10000)

        # Screenshot Dashboard (Check Icon Animation on hover if possible, static screenshot hard to capture animation but verifies layout)
        page.hover('.dept-card')
        page.wait_for_timeout(1000) # Wait for animation
        page.screenshot(path='verification/dashboard_hover.png')

        # Verify Loading Bar exists in DOM
        loading_bar = page.query_selector('.loading-bar')
        if loading_bar:
            print('Loading Bar found in DOM')
        else:
            print('Loading Bar NOT found')

        browser.close()

if __name__ == '__main__':
    run()
