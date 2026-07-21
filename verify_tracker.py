from playwright.sync_api import sync_playwright

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 800})

        # Mock google.script.run
        page.add_init_script("""
            window.google = {
                script: {
                    run: {
                        withSuccessHandler: function(cb) {
                            return {
                                withFailureHandler: function(fb) {
                                    return new Proxy({}, {
                                        get: function(target, prop) {
                                            return function() {
                                                console.log("Called mock google.script.run." + prop);
                                                if (prop === 'verifyUserLogin') {
                                                    cb({
                                                        userType: 'ESTANDAR',
                                                        userName: 'TEST USER',
                                                        userAvatar: ''
                                                    });
                                                } else if (prop === 'apiFetchTrackerRows') {
                                                    cb([
                                                        ['ID', 'FOLIO', 'FECHA', 'CONCEPTO', 'VENDEDOR/RESPONSABLE', 'AVANCE', 'PRIORIDAD', 'RIESGO', 'ESTATUS', 'DEPARTAMENTO'],
                                                        ['1', '1001', '2023-10-27', 'Test Concept', 'JP', '50%', 'Alta', 'Medio', 'En Proceso', 'Ventas']
                                                    ]);
                                                } else if (prop === 'getUserDirectory') {
                                                    cb([]);
                                                } else {
                                                    cb([]);
                                                }
                                            }
                                        }
                                    });
                                }
                            };
                        }
                    }
                }
            };
        """)

        page.goto("http://localhost:3000/index.html")
        page.wait_for_timeout(1000)

        # Try to login
        page.fill('input[type="text"]', 'test')
        page.fill('input[type="password"]', 'test')
        page.click('button:has-text("INICIAR SESIÓN")')

        page.wait_for_timeout(3000)

        page.screenshot(path="verification.png")
        print("Screenshot saved to verification.png")

        browser.close()

if __name__ == "__main__":
    main()
