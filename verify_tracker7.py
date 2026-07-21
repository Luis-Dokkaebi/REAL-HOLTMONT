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
                            var runner = {
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
                                                } else if (prop === 'getSystemConfig') {
                                                    cb({
                                                        success: true,
                                                        config: {
                                                            departments: ['Ventas', 'Desarrollo'],
                                                            priorities: ['Alta', 'Media', 'Baja'],
                                                            statusList: ['En Proceso', 'Terminado']
                                                        }
                                                    });
                                                } else if (prop === 'getDirectoryCache') {
                                                    cb({
                                                        success: true,
                                                        data: []
                                                    });
                                                } else if (prop === 'apiFetchTrackerRows') {
                                                    cb({
                                                        success: true,
                                                        data: [
                                                            ['ID', 'FOLIO', 'FECHA', 'CONCEPTO', 'VENDEDOR/RESPONSABLE', 'AVANCE', 'PRIORIDAD', 'RIESGO', 'ESTATUS', 'DEPARTAMENTO'],
                                                            ['1', '1001', '2023-10-27', 'Test Concept', 'TEST USER', '50%', 'Alta', 'Medio', 'En Proceso', 'Ventas']
                                                        ]
                                                    });
                                                } else {
                                                    cb({success: true, data: []});
                                                }
                                            }
                                        }
                                    });
                                }
                            };
                            return new Proxy(runner, {
                                get: function(target, prop) {
                                    if(prop === 'withFailureHandler') return target[prop];
                                    return function(...args) {
                                        console.log("Called mock google.script.run." + prop + " with args:", args);
                                        if (prop === 'getSystemConfig') {
                                            cb({
                                                departments: ['Ventas'],
                                                priorities: ['Alta'],
                                                statusList: ['En Proceso']
                                            });
                                        } else if (prop === 'apiFetchTrackerRows') {
                                            cb([
                                                ['ID', 'FOLIO', 'FECHA', 'CONCEPTO', 'VENDEDOR/RESPONSABLE', 'AVANCE', 'PRIORIDAD', 'RIESGO', 'ESTATUS', 'DEPARTAMENTO'],
                                                ['1', '1001', '2023-10-27', 'Test Concept', 'TEST USER', '50%', 'Alta', 'Medio', 'En Proceso', 'Ventas']
                                            ]);
                                        } else if (prop === 'getDirectoryCache') {
                                            cb([]);
                                        } else if (prop === 'apiFetchCascadeTree') {
                                            cb({ success: true, data: [] });
                                        } else if (prop === 'apiFetchCombinedCalendarData') {
                                            cb({ success: true, data: [] });
                                        } else if (prop === 'apiFetchDrafts') {
                                            cb({ success: true, data: [] });
                                        } else {
                                            cb([]);
                                        }
                                    }
                                }
                            });
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

        # Take screenshot
        page.screenshot(path="verification7.png", full_page=True)
        print("Screenshot saved to verification7.png")

        browser.close()

if __name__ == "__main__":
    main()
