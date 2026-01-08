from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load local HTML file
        page.goto('file://' + os.path.abspath('index.html'))

        # Debug: Print page content if selectors fail
        # page.wait_for_timeout(2000)
        # print(page.content())

        # Wait for #app to verify Vue mount
        # page.wait_for_selector('#app')

        # NOTE: If Vue is failing to mount due to CDN issues or JS errors, selectors will timeout.
        # Let's check if we can see the Login Overlay which should be v-if=!isLoggedIn (default true)
        try:
            page.wait_for_selector('.login-overlay', timeout=5000)
            print('Login Overlay found.')
        except:
            print('Login Overlay NOT found. Vue might not have mounted.')
            print(page.content())
            return

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
                            setTimeout(() => {
                                if(this.successCallback) this.successCallback({
                                    success: true,
                                    name: 'Admin User',
                                    username: 'ADMIN',
                                    role: 'ADMIN'
                                });
                            }, 100);
                        },
                        getSystemConfig: function(role) {
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

        # Perform Login
        try:
            page.fill('input[placeholder="Usuario"]', 'LUIS_CARLOS')
            page.fill('input[placeholder="Contraseña..."]', 'admin2025')
            page.click('button:has-text("INICIAR SESIÓN")')
            print('Login clicked')
        except Exception as e:
            print('Error interacting with login form: ' + str(e))
            return

        # Wait for Dashboard
        try:
            page.wait_for_selector('.dept-card', timeout=5000)
            print('Dashboard loaded.')
        except:
            print('Dashboard NOT loaded.')
            print(page.content())
            return

        # Screenshot
        page.hover('.dept-card')
        page.wait_for_timeout(1000)
        page.screenshot(path='verification/dashboard_hover.png')

        # Verify Loading Bar exists
        loading_bar = page.query_selector('.loading-bar')
        if loading_bar:
            print('Loading Bar found in DOM')
        else:
            print('Loading Bar NOT found')

        browser.close()

if __name__ == '__main__':
    run()
