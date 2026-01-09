from playwright.sync_api import sync_playwright, expect
import time
import json

def verify_project_program_full_flow():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()

        page.on("console", lambda msg: print(f"BROWSER LOG: {msg.text}"))
        page.on("pageerror", lambda err: print(f"BROWSER ERROR: {err}"))

        # 1. Mock window.google.script.run
        page.add_init_script("""
            window.lastSavedPayload = null;
            window.google = {
                script: {
                    run: {
                        withSuccessHandler: function(callback) {
                            return {
                                withFailureHandler: function() { return this; },
                                apiLogin: function(u, p) {
                                    console.log("Mock apiLogin called");
                                    setTimeout(() => callback({success: true, name: 'Workorder User', username: 'PREWORK_ORDER', role: 'WORKORDER_USER'}), 50);
                                    return this;
                                },
                                getSystemConfig: function() {
                                    console.log("Mock getSystemConfig called");
                                    setTimeout(() => callback({
                                        departments: {}, allDepartments: {"CONSTRUCCION": { label: "Construcción" }},
                                        staff: [], directory: [{name: "JUAN PEREZ", dept: "CONSTRUCCION", type: "ESTANDAR"}],
                                        specialModules: [{ id: "PPC_MASTER", label: "Pre Work Order", icon: "fa-tasks", color: "#fd7e14", type: "ppc_native" }],
                                        accessProjects: false
                                    }), 50);
                                    return this;
                                },
                                apiGetNextWorkOrderSeq: function() { callback('0001'); return this; },
                                apiFetchPPCData: function() { callback({success: true, data: []}); return this; },
                                apiFetchCascadeTree: function() { callback({success: true, data: []}); return this; },
                                apiFetchDrafts: function() { callback({success: true, data: []}); return this; },
                                apiSavePPCData: function(payload, user) {
                                    window.lastSavedPayload = payload; // Capture payload
                                    console.log("Payload captured:", JSON.stringify(payload));
                                    callback({success: true, ids: ['TEST-ID-123']});
                                    return this;
                                }
                            };
                        },
                        withFailureHandler: function() { return this; },
                        apiLogout: function() {}
                    }
                }
            };
        """)

        # 2. Login & Navigation
        page.goto("http://localhost:8000/index.html")
        page.fill("input[placeholder='Usuario']", "PREWORK_ORDER")
        page.fill("input[placeholder='Contraseña...']", "workorder2026")
        page.click("button:has-text('INICIAR SESIÓN')")

        print("Waiting for dashboard...")
        page.wait_for_selector(".dept-card", timeout=20000)
        print("Dashboard loaded.")

        page.click(".dept-card:has-text('Pre Work Order')")

        # 3. Fill Mandatory Fields
        page.fill("input[placeholder='Ej: Corning Optical...']", "TEST CLIENT")
        page.click("button:has-text('Construcción')")

        # Add "Elaboró" (Cotizador)
        # Type into the search box to trigger dropdown
        page.fill("input[placeholder='Buscar...']", "JUAN")
        # Wait for dropdown item
        page.wait_for_selector("li.list-group-item:has-text('JUAN PEREZ')")
        page.click("li.list-group-item:has-text('JUAN PEREZ')")

        # 4. Modify Program Sections
        # Add item to VISITA
        print("Adding VISITA item...")
        page.locator("div.mb-3").filter(has_text="1. VISITA").locator("button.btn-primary").click()
        page.locator("div.mb-3").filter(has_text="1. VISITA").locator("input[placeholder='Descripción']").nth(-1).fill("Visita Item")

        # Add item to 4. Cotización Trabajo
        print("Adding TRABAJO item...")
        page.locator("div.mb-3").filter(has_text="4. Cotización Trabajo").locator("button.btn-primary").click()
        page.locator("div.mb-3").filter(has_text="4. Cotización Trabajo").locator("input[placeholder='Descripción']").nth(-1).fill("Trabajo Item")

        # 5. Submit
        submit_btn = page.locator("button.btn-quote-gen")
        submit_btn.scroll_into_view_if_needed()
        submit_btn.click()

        # 6. Verify Payload
        time.sleep(2)
        expect(page.locator("h2#swal2-title")).to_contain_text("Pre Work Order Guardada")

        payload_handle = page.evaluate_handle("window.lastSavedPayload")
        payload = payload_handle.json_value()

        print("Verifying Payload Structure...")
        if not payload:
            raise Exception("Payload not captured!")

        data = payload[0]
        program = data.get('programa', [])
        print(f"Program Items Count: {len(program)}")

        visita_items = [i for i in program if i.get('seccion') == 'VISITA']
        trabajo_items = [i for i in program if i.get('seccion') == 'TRABAJO']

        print(f"VISITA items: {len(visita_items)}")
        print(f"TRABAJO items: {len(trabajo_items)}")

        assert len(visita_items) >= 2, "Should have at least 2 VISITA items"
        assert any(i['description'] == 'Visita Item' for i in visita_items), "New Visita item not found"

        assert len(trabajo_items) >= 1, "Should have at least 1 TRABAJO item"
        assert any(i['description'] == 'Trabajo Item' for i in trabajo_items), "New Trabajo item not found"

        print("✅ Payload Verification Passed!")

        # 7. Final Screenshot
        page.screenshot(path="verification/final_submission.png")
        browser.close()

if __name__ == "__main__":
    try:
        verify_project_program_full_flow()
    except Exception as e:
        print(f"Error: {e}")
        exit(1)
