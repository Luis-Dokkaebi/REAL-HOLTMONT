
import os
import sys
import time
from playwright.sync_api import sync_playwright

def verify_manual_avance():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Robust Mock for Google Apps Script
        page.add_init_script("""
            const mockApi = {
                apiLogin: (u, p) => {
                     return {
                        success: true,
                        name: 'ANTONIA_VENTAS',
                        username: 'ANTONIA_VENTAS',
                        role: 'TONITA'
                     };
                },
                getSystemConfig: (r) => {
                     return {
                        departments: { "VENTAS": { "label": "Ventas", "color": "#0dcaf0" } },
                        staff: [{ "name": "ANTONIA_VENTAS", "dept": "VENTAS" }],
                        directory: [{ "name": "ANTONIA_VENTAS", "dept": "VENTAS", "type": "VENTAS" }],
                        specialModules: [{ id: "PPC_MASTER", label: "PPC Maestro", icon: "fa-tasks", color: "#fd7e14", type: "ppc_native" }]
                     };
                },
                apiFetchStaffTrackerData: (name) => {
                     return {
                        success: true,
                        headers: ['ID', 'CLIENTE', 'CONCEPTO', 'FECHA', 'AVANCE', 'ESTATUS', 'DIAS', 'CLASIFICACION'],
                        data: [{
                            'ID': '123',
                            'CLIENTE': 'Test Client',
                            'CONCEPTO': 'Test Concept',
                            'FECHA': '01/01/24',
                            'AVANCE': '',
                            'ESTATUS': 'PENDIENTE',
                            'DIAS': 0,
                            'CLASIFICACION': 'A'
                        }],
                        history: []
                     };
                },
                apiUpdateTask: (sheet, row, user) => {
                     const avance = row['AVANCE'];
                     if (avance === '100' || avance === '100%') {
                         return { success: true, moved: true };
                     } else {
                         return { success: true, moved: false };
                     }
                },
                apiFetchTeamKPIData: (u) => ({ success: true, ventas: [], tracker: [] }),
                apiFetchWeeklyPlanData: () => ({ success: true, data: [], headers: [] }),
                apiFetchDrafts: () => ({ success: true, data: [] }),
                apiFetchCascadeTree: () => ({ success: true, data: [] })
            };

            const wrapApi = (success, failure) => {
                const wrapped = {};
                for (const key in mockApi) {
                    wrapped[key] = (...args) => {
                        setTimeout(() => {
                            try {
                                const result = mockApi[key](...args);
                                if (success) success(result);
                            } catch (e) {
                                if (failure) failure(e);
                            }
                        }, 10);
                        return null;
                    };
                }
                return wrapped;
            };

            window.google = {
                script: {
                    run: {
                        withSuccessHandler: function(success) {
                            const api = wrapApi(success, null);
                            api.withFailureHandler = function(failure) {
                                return wrapApi(success, failure);
                            };
                            return api;
                        },
                        apiLogout: () => {}
                    }
                }
            };
        """)

        page.goto(f"file://{os.path.abspath('index.html')}")

        # Login
        page.fill('input[placeholder="Usuario"]', 'ANTONIA_VENTAS')
        page.fill('input[placeholder="Contraseña..."]', 'tonita2025')
        page.click('button:has-text("INICIAR SESIÓN")')

        # Wait for Dashboard
        page.wait_for_selector('.app-wrapper')
        print("Login successful")

        # Navigate to Sales Tracker
        page.click('.dept-card:has-text("Ventas")')
        page.wait_for_selector('.staff-card:has-text("ANTONIA_VENTAS")')
        page.click('.staff-card:has-text("ANTONIA_VENTAS")')

        # Wait for table
        page.wait_for_selector('.table-excel', timeout=10000)
        print("Tracker loaded")

        # Verify AVANCE input
        input_locator = page.locator('table.table-excel tbody tr:first-child td:nth-child(6) input')
        if input_locator.count() == 0:
             # Fallback search by scanning headers
             headers = page.locator('table.table-excel thead th').all_inner_texts()
             try:
                 idx = next(i for i, h in enumerate(headers) if 'AVANCE' in h.upper())
                 input_locator = page.locator(f'table.table-excel tbody tr:first-child td:nth-child({idx + 2}) input')
             except StopIteration:
                 print("AVANCE header not found")
                 sys.exit(1)

        print("Found AVANCE input")

        # Verify not readonly
        if input_locator.get_attribute('readonly'):
            print("Error: AVANCE input is readonly!")
            sys.exit(1)

        # Test Edit: 50
        input_locator.fill("50")
        # Click the save button in the first row (the last cell)
        page.click('table.table-excel tbody tr:first-child td:last-child button')

        # Wait for 'Guardado' toast
        try:
            page.wait_for_selector('.swal2-title:has-text("Guardado")', timeout=5000)
            print("Verified: Saved 50%")
        except:
            print("Error: Save toast not seen")
            page.screenshot(path='error_save.png')
            sys.exit(1)

        # Test Move: 100
        input_locator.fill("100")
        page.click('table.table-excel tbody tr:first-child td:last-child button')

        # Wait for 'Archivado' toast
        try:
            page.wait_for_selector('.swal2-title:has-text("Archivado")', timeout=5000)
            print("Verified: Moved 100%")
        except:
            print("Error: Archive toast not seen")
            page.screenshot(path='error_archive.png')
            sys.exit(1)

        browser.close()

if __name__ == "__main__":
    verify_manual_avance()
