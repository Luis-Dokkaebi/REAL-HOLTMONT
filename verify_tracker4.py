from playwright.sync_api import sync_playwright

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 800})

        page.on("console", lambda msg: print(f"Browser console: {msg.text}"))

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
                                            return function(...args) {
                                                console.log("Called mock google.script.run." + prop + " with args:", args);
                                                if (prop === 'apiLogin') {
                                                    cb({
                                                        success: true,
                                                        role: 'ESTANDAR',
                                                        name: 'TEST USER',
                                                        username: 'testuser'
                                                    });
                                                } else if (prop === 'apiFetchTrackerRows') {
                                                    cb({
                                                        success: true,
                                                        data: [
                                                            ['ID', 'FOLIO', 'FECHA', 'CONCEPTO', 'VENDEDOR/RESPONSABLE', 'AVANCE', 'PRIORIDAD', 'RIESGO', 'ESTATUS', 'DEPARTAMENTO'],
                                                            ['1', '1001', '2023-10-27', 'Test Concept', 'JP', '50%', 'Alta', 'Medio', 'En Proceso', 'Ventas']
                                                        ]
                                                    });
                                                } else if (prop === 'apiGetUserConfig') {
                                                    cb({
                                                        success: true,
                                                        config: {
                                                            role: 'ESTANDAR'
                                                        }
                                                    });
                                                } else if (prop === 'getInitialData') {
                                                    cb({
                                                        success: true,
                                                        data: {}
                                                    });
                                                } else {
                                                    cb({success: true, data: []});
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

        page.wait_for_timeout(2000)

        # Take screenshot of whatever is there
        page.screenshot(path="verification4.png", full_page=True)
        print("Screenshot saved to verification4.png")

        browser.close()

if __name__ == "__main__":
    main()
