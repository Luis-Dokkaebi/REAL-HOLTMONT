from playwright.sync_api import sync_playwright
import os
import json

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
    page.on("pageerror", lambda err: print(f"ERROR: {err}"))

    page.add_init_script("""
    window.mockBackend = {
        apiLogin: function(u, p, callback) {
            console.log("Mock apiLogin called for", u);
            if(u==='PREWORK_ORDER' && p==='workorder2026') {
                callback({success:true, name:'WORKORDER_USER', role:'WORKORDER_USER', username:'PREWORK_ORDER'});
            } else {
                callback({success:false, message:'Invalid'});
            }
        },
        getSystemConfig: function(role, callback) {
            console.log("Mock getSystemConfig called");
            callback({
                departments: {},
                staff: [],
                directory: [{name:'JESUS_CANTU', dept:'ADMIN'}],
                specialModules: [{ id: "PPC_MASTER", label: "Pre Work Order", icon: "fa-tasks", color: "#fd7e14", type: "ppc_native" }],
                accessProjects: false
            });
        },
        apiGetNextWorkOrderSeq: function(callback) {
            callback("0005");
        },
        apiFetchPPCData: function(callback) {
            callback({success:true, data:[]});
        },
        apiFetchCascadeTree: function(callback) {
            callback({success:true, data:[]});
        },
        apiSavePPCData: function(payload, user, callback) {
            console.log("Mock apiSavePPCData called");
            console.log("PAYLOAD RECEIVED_JSON:" + JSON.stringify(payload));
            window.LAST_PAYLOAD = payload;
            callback({success:true, ids:['WO-12345']});
        }
    };

    window.google = {
        script: {
            run: {
                withSuccessHandler: function(callback) {
                    return createRunner(callback, null);
                },
                withFailureHandler: function(callback) {
                    return createRunner(null, callback);
                },
                ...createRunner(null, null)
            }
        }
    };

    function createRunner(successCb, failureCb) {
        return {
            withSuccessHandler: function(cb) { return createRunner(cb, failureCb); },
            withFailureHandler: function(cb) { return createRunner(successCb, cb); },
            apiLogin: function(u, p) { window.mockBackend.apiLogin(u, p, successCb); },
            getSystemConfig: function(r) { window.mockBackend.getSystemConfig(r, successCb); },
            apiGetNextWorkOrderSeq: function() { window.mockBackend.apiGetNextWorkOrderSeq(successCb); },
            apiFetchPPCData: function() { window.mockBackend.apiFetchPPCData(successCb); },
            apiFetchCascadeTree: function() { window.mockBackend.apiFetchCascadeTree(successCb); },
            apiSavePPCData: function(p, u) { window.mockBackend.apiSavePPCData(p, u, successCb); },
            apiLogout: function() {},
            apiSyncDrafts: function() {}
        };
    }
    """)

    cwd = os.getcwd()
    page.goto(f"file://{cwd}/index.html")

    page.fill('input[placeholder="Usuario"]', 'PREWORK_ORDER')
    page.fill('input[placeholder="Contraseña..."]', 'workorder2026')
    page.click('button:has-text("INICIAR SESIÓN")')

    # Wait for Dashboard load (check for "Pre Work Order" card)
    page.wait_for_selector('h6:has-text("Pre Work Order")', timeout=5000)

    # Click the module to open Work Order Form
    page.click('h6:has-text("Pre Work Order")')

    # NOW wait for the header
    page.wait_for_selector('h4:has-text("Holtmont Services")', timeout=5000)

    page.fill('input[placeholder="Ej: Corning Optical..."]', 'CLIENTE TEST')
    page.click('button:has-text("Construcción")')

    page.wait_for_timeout(500)
    page.select_option('select.form-select', index=1)

    buttons = page.locator('button:has-text("Agregar")')
    print(f"Found {buttons.count()} Add buttons")
    if buttons.count() > 0:
        buttons.first.click()

    page.check('input.form-check-input >> nth=0')

    page.click('button:has-text("Guardar Borrador")')

    page.wait_for_timeout(1000)
    page.screenshot(path="verification/verification_wo_payload.png", full_page=True)

    payload = page.evaluate("window.LAST_PAYLOAD")
    if payload:
        print("PAYLOAD CAPTURED SUCCESS")
        item = payload[0]
        if 'materiales' in item and len(item['materiales']) > 0:
            print("✅ Materiales present in payload")
        else:
            print("❌ Materiales MISSING")

        if 'checkList' in item and item['checkList'].get('libreta') is True:
             print("✅ CheckList present and correct")
        else:
             print("❌ CheckList MISSING")
    else:
        print("❌ NO PAYLOAD CAPTURED")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
