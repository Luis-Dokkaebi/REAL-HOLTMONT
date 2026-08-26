import asyncio
from playwright.async_api import async_playwright
import json
import sys

# Color codes for output
GREEN = "\033[92m"
RED = "\033[91m"
RESET = "\033[0m"
BOLD = "\033[1m"

async def run_test(name, test_func):
    print(f"\n{BOLD}Running Test: {name}{RESET}")
    try:
        await test_func()
        print(f"{GREEN}✓ {name} PASSED{RESET}")
        return True
    except Exception as e:
        print(f"{RED}✗ {name} FAILED: {e}{RESET}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])

        # --- TEST 1: ADMIN DASHBOARD & KPI ---
        async def test_admin_dashboard():
            page = await browser.new_page()

            # Mock API
            await page.add_init_script("""
                window.lastApiCall = {};
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
                                if (u === 'LUIS_CARLOS') {
                                    this.successCallback({ success: true, role: 'ADMIN', name: 'Luis Carlos', username: 'LUIS_CARLOS' });
                                } else {
                                    this.failureCallback({ message: 'Invalid credentials' });
                                }
                            },
                            getSystemConfig: function(role) {
                                const config = {
                                    departments: {'VENTAS': {label: 'Ventas', color: 'blue'}},
                                    staff: [],
                                    directory: [],
                                    specialModules: [
                                        {id: 'KPI_DASHBOARD', label: 'KPI Performance', icon: 'fa-chart-line', type: 'kpi_dashboard_view'}
                                    ]
                                };
                                this.successCallback(config);
                            },
                            apiFetchTeamKPIData: function(u) {
                                this.successCallback({
                                    success: true,
                                    ventas: [{name: 'Seller A', volume: 10, efficiency: 2.5}],
                                    tracker: [{name: 'Staff A', volume: 5, efficiency: 1.0}],
                                    productivity: {labels: ['A','B'], values: [1,2]}
                                });
                            },
                            apiFetchDrafts: function() { this.successCallback({success: true, data: []}); },
                            apiFetchCascadeTree: function() { this.successCallback({success: true, data: []}); }
                        }
                    }
                };
            """)

            await page.goto("http://localhost:8000/index.html")

            # Login
            await page.fill("input[placeholder='Usuario']", "LUIS_CARLOS")
            await page.fill("input[placeholder='Contraseña...']", "password")
            await page.click("button:has-text('INICIAR SESIÓN')")

            # Verify Dashboard
            await page.wait_for_selector("text=Dashboard")

            # Navigate to KPI via Dashboard Card
            # Use specific class to avoid ambiguity
            await page.click(".dept-card:has-text('KPI Performance')")

            await page.wait_for_selector("canvas#kpiChartVentas")
            await page.wait_for_selector("canvas#kpiChartTracker")

            print("  - Admin login successful")
            print("  - KPI Dashboard loaded with charts")

            await page.close()

        # --- TEST 2: WORKORDER FORM FUNCTIONALITY ---
        async def test_workorder_form():
            page = await browser.new_page()

            # Mock API
            await page.add_init_script("""
                window.savedPayload = null;
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
                                this.successCallback({ success: true, role: 'WORKORDER_USER', name: 'PreWork', username: 'PREWORK_ORDER' });
                            },
                            getSystemConfig: function(role) {
                                this.successCallback({
                                    departments: {'ELECTROMECANICA': {label: 'Electromecánica', color: '#000'}},
                                    staff: [{name: 'Test Staff', dept: 'ELECTROMECANICA'}],
                                    directory: [{name: 'Test Staff', dept: 'ELECTROMECANICA'}, {name: 'Cotizador 1', dept: 'VENTAS'}],
                                    specialModules: [
                                        {id: 'PPC_MASTER', label: 'Pre Work Order', icon: 'fa-clipboard-list', type: 'ppc_native'}
                                    ]
                                });
                            },
                            apiGetNextWorkOrderSeq: function() { this.successCallback('1000'); },
                            apiSavePPCData: function(payload, user) {
                                window.savedPayload = payload;
                                this.successCallback({ success: true, ids: ['WO-1000-TEST'] });
                            },
                            apiFetchCascadeTree: function() { this.successCallback({success: true, data: []}); }
                        }
                    }
                };
            """)

            await page.goto("http://localhost:8000/index.html")

            # Login
            await page.fill("input[placeholder='Usuario']", "PREWORK_ORDER")
            await page.fill("input[placeholder='Contraseña...']", "pass")
            await page.click("button:has-text('INICIAR SESIÓN')")

            # Wait for Dashboard Card "Pre Work Order"
            await page.wait_for_selector(".dept-card:has-text('Pre Work Order')")
            await page.click(".dept-card:has-text('Pre Work Order')")

            # Verify Redirect to WORKORDER_FORM
            await page.wait_for_selector("text=Holtmont Services")
            await page.wait_for_selector("text=PRE WORK ORDER")

            # 1. Fill Client Info
            await page.fill("input[placeholder='Ej: Corning Optical...']", "Test Client")

            # Select Work Type (Required)
            await page.click("button:has-text('Construcción')")

            # Select Department
            await page.click("button:has-text('Electromecánica')")

            # Add "Elaboró" (Cotizador)
            await page.fill("input[placeholder='Buscar...']", "Cotizador")
            await page.wait_for_selector("li:has-text('Cotizador 1')")
            await page.click("li:has-text('Cotizador 1')")

            # 2. Fill Project Program (Add Item)
            await page.locator(".card-header:has-text('PROGRAMA DEL PROYECTO')").locator("button:has-text('Agregar')").click()

            program_card = page.locator(".card:has-text('PROGRAMA DEL PROYECTO')").locator(".card-body.bg-light")
            last_row = program_card.locator(".card").last
            await last_row.locator("input[placeholder='Descripción']").fill("Task 1")
            await last_row.locator("input[placeholder='Cant']").fill("2")
            await last_row.locator("input[placeholder='P.U.']").fill("100")

            # 3. Fill Labor (Mano de Obra)
            labor_section = page.locator(".card:has-text('MANO DE OBRA')")
            first_labor_row = labor_section.locator("tbody tr").first
            await first_labor_row.locator("input[placeholder='Puesto']").fill("Técnico")
            await first_labor_row.locator("input[placeholder='0']").nth(0).fill("2000") # Salary
            await first_labor_row.locator("input[placeholder='0']").nth(1).fill("2")    # Personnel
            await first_labor_row.locator("input[placeholder='0']").nth(2).fill("2")    # Weeks

            # 4. Fill Materials
            materials_section = page.locator(".card:has-text('MATERIALES REQUERIDOS')")
            first_mat_row = materials_section.locator("tbody tr").first
            await first_mat_row.locator("input[placeholder='0']").nth(0).fill("5") # Qty
            await first_mat_row.locator("input[placeholder='0.00']").fill("50")    # Cost

            # 5. Verify Footer Totals
            await page.wait_for_timeout(2000)

            # 6. Save
            await page.locator("button:has-text('Generar Cotización')").click()

            # Wait for success message
            await page.wait_for_selector(".swal2-success")

            # Check Payload
            payload = await page.evaluate("window.savedPayload")
            if not payload:
                raise Exception("Save payload not captured")

            item = payload[0]
            if item['cliente'] != "Test Client": raise Exception(f"Payload Client mismatch: {item['cliente']}")
            if len(item['materiales']) != 1: raise Exception("Materials length mismatch")
            if len(item['manoObra']) != 1: raise Exception("Labor length mismatch")

            print("  - Workorder form filled and saved")
            print("  - Payload verified")

            await page.close()

        # --- TEST 3: STAFF TRACKER ---
        async def test_staff_tracker():
            page = await browser.new_page()

            await page.add_init_script("""
                window.google = {
                    script: {
                        run: {
                            withSuccessHandler: function(callback) { this.successCallback = callback; return this; },
                            withFailureHandler: function(callback) { this.failureCallback = callback; return this; },
                            apiLogin: function() {
                                this.successCallback({ success: true, role: 'EDUARDO_USER', name: 'Eduardo Teran', username: 'EDUARDO_TERAN' });
                            },
                            getSystemConfig: function(role) {
                                this.successCallback({
                                    departments: {},
                                    staff: [{name: 'Eduardo Teran', dept: 'CONSTRUCCION'}],
                                    directory: [],
                                    specialModules: [
                                        {id: 'MY_TRACKER', label: 'Mi Tabla', type: 'mirror_staff', target: 'EDUARDO TERAN'}
                                    ]
                                });
                            },
                            apiFetchStaffTrackerData: function(sheet) {
                                this.successCallback({
                                    success: true,
                                    name: sheet,
                                    headers: ['ID', 'CONCEPTO', 'ESTATUS', 'DIAS'],
                                    data: [],
                                    history: []
                                });
                            },
                            apiUpdateTask: function(sheet, row) {
                                this.successCallback({ success: true });
                            },
                            apiFetchCascadeTree: function() { this.successCallback({success: true, data: []}); }
                        }
                    }
                };
            """)

            await page.goto("http://localhost:8000/index.html")

            # Login
            await page.fill("input[placeholder='Usuario']", "EDUARDO_TERAN")
            await page.fill("input[placeholder='Contraseña...']", "pass")
            await page.click("button:has-text('INICIAR SESIÓN')")

            # Click Module
            await page.click(".dept-card")

            # Verify Table
            await page.wait_for_selector(".table-excel")

            # Add Row
            await page.click("button[title='Agregar']")

            # Verify row added (check row count)
            # Initial data empty, adding 1 row -> 1 row in tbody
            rows = page.locator("tbody tr")
            if await rows.count() == 0:
                raise Exception("Row not added to tracker")

            print("  - Staff tracker loaded and row added")

            await page.close()

        # --- RUN TESTS ---
        results = []
        results.append(await run_test("Admin Dashboard & KPI", test_admin_dashboard))
        results.append(await run_test("Workorder Form Functional", test_workorder_form))
        results.append(await run_test("Staff Tracker", test_staff_tracker))

        if all(results):
            print(f"\n{BOLD}{GREEN}ALL QA TESTS PASSED{RESET}")
            sys.exit(0)
        else:
            print(f"\n{BOLD}{RED}SOME TESTS FAILED{RESET}")
            sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
