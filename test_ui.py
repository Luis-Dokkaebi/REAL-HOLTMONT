from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    filepath = "file://" + os.path.abspath("index.html")
    # Let's mock google.script.run for the UI test
    page.add_init_script("""
    window.google = {
        script: {
            run: {
                withSuccessHandler: function(cb) {
                    this.cb = cb;
                    return this;
                },
                withFailureHandler: function(cb) {
                    this.failCb = cb;
                    return this;
                },
                apiLogin: function(user, pass) {
                    setTimeout(() => {
                        if (user === 'TERESA_USER') {
                            this.cb({success: true, name: 'TERESA GARZA', username: 'TERESA_USER', role: 'TERESA_USER'});
                        } else {
                            this.cb({success: false, message: 'Invalid'});
                        }
                    }, 500);
                },
                getSystemConfig: function() {
                    setTimeout(() => {
                        this.cb({
                            specialModules: [
                                { id: "MY_TRACKER", label: "Mi Tabla", icon: "fa-table", color: "#e83e8c", type: "mirror_staff", target: "TERESA GARZA" },
                                { id: "MY_SALES", label: "Ventas", icon: "fa-hand-holding-usd", color: "#0dcaf0", type: "mirror_staff", target: "TERESA GARZA (VENTAS)" }
                            ],
                            departments: {}
                        });
                    }, 500);
                },
                apiFetchStaffTrackerData: function(target) {
                    setTimeout(() => {
                        this.cb({
                            success: true,
                            headers: ['FOLIO', 'DESCRIPCION', 'COMENTARIO', 'COMENTARIOS', 'OBSERVACIONES'],
                            data: [{ FOLIO: '123', DESCRIPCION: 'Test', COMENTARIO: 'A comment\\nLine 2', COMENTARIOS: 'Other comment', OBSERVACIONES: 'My obs' }],
                            history: []
                        });
                    }, 500);
                }
            }
        }
    };
    """)
    page.goto(filepath)
    page.wait_for_timeout(2000)

    # Login as Teresa Garza
    page.locator('input[placeholder="Usuario"]').fill("TERESA_USER")
    page.wait_for_timeout(500)
    page.locator('input[placeholder="Contraseña..."]').fill("1234")
    page.wait_for_timeout(500)
    page.keyboard.press("Enter")
    page.wait_for_timeout(4000)

    # Dismiss any alerts
    if page.locator(".swal2-confirm").is_visible():
        page.locator(".swal2-confirm").click()
        page.wait_for_timeout(1000)

    # In Dashboard we have special modules loaded for this role! Let's find it.
    # We will trigger the window.app exposed function directly since we mock loadDashboardCalendar.
    page.evaluate("window.app.openModule({id: 'MY_SALES', type: 'mirror_staff', target: 'TERESA GARZA (VENTAS)'})")
    page.wait_for_timeout(4000)

    # Take a screenshot to see where we are
    page.screenshot(path="/home/jules/verification/screenshots/verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos",
            viewport={'width': 1280, 'height': 800}
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
