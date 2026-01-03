from playwright.sync_api import sync_playwright
import os
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Mock Google Apps Script API - Correctly chaining withSuccessHandler
        page.add_init_script("""
        window.google = {
          script: {
            run: {
              withSuccessHandler: function(callback) {
                // Return an object that has the functions we expect to be chained
                // OR simple functions that might be called directly if not chained.
                // The structure in Vue is: google.script.run.withSuccessHandler(...).apiLogin(...)

                const api = {
                  withFailureHandler: function(failCallback) {
                     return api; // Chainable
                  },
                  apiLogin: function(u, p) {
                    console.log("Mock apiLogin called");
                    callback({
                      success: true,
                      role: 'WORKORDER_USER',
                      name: 'WorkOrder User',
                      username: 'PREWORK_ORDER'
                    });
                  },
                  getSystemConfig: function(role) {
                     console.log("Mock getSystemConfig called with role:", role);
                     const allDepts = {
                          "CONSTRUCCION": { label: "Construcción", icon: "fa-hard-hat", color: "#e83e8c" },
                          "VENTAS": { label: "Ventas", icon: "fa-handshake", color: "#0dcaf0" }
                      };
                     const fullDirectory = [
                        { name: "Juan Perez", dept: "CONSTRUCCION" },
                        { name: "Maria Lopez", dept: "VENTAS" }
                     ];
                     const woModule = { id: "PPC_MASTER", label: "Pre Work Order", type: "ppc_native", icon: "fa-tasks", color: "#fd7e14" };

                     callback({
                        departments: {},
                        allDepartments: allDepts,
                        staff: [],
                        directory: fullDirectory,
                        specialModules: [ woModule ],
                        accessProjects: false
                     });
                  },
                  apiFetchPPCData: function() { callback({success:true, data:[]}); },
                  apiFetchWeeklyPlanData: function() { callback({success:true, data:[], headers:[]}); },
                  apiFetchCascadeTree: function() { callback({success:true, data:[]}); },
                  apiFetchDrafts: function() { callback({success:true, data:[]}); },
                  apiSavePPCData: function(payload, user) {
                     console.log("Saving payload:", payload);
                     callback({success:true, ids:['WO-1234']});
                  }
                };
                return api;
              },
              apiLogout: function() {}
            }
          }
        };
        """)

        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))

        url = f"file://{os.getcwd()}/verification/index.html"
        page.goto(url)

        print("Attempting login...")
        page.fill("input[placeholder='Usuario']", "PREWORK_ORDER")
        page.fill("input[placeholder='Contraseña...']", "password")
        page.click("button:has-text('INICIAR SESIÓN')")

        print("Waiting for sidebar...")
        # Wait for the mock config to load and update DOM
        page.wait_for_timeout(1000)
        try:
            page.wait_for_selector(".sidebar", timeout=5000)
            print("Sidebar found.")
        except:
             page.screenshot(path="verification/debug_login_fail.png")
             print("Sidebar not found. Check console logs.")
             raise

        page.screenshot(path="verification/debug_dashboard.png")

        print("Clicking 'Pre Work Order'...")
        try:
            page.click("text=Pre Work Order", timeout=5000)
        except:
             print("Retrying click on .nav-text...")
             # Debug html
             # print(page.content())
             page.click(".nav-text:has-text('Pre Work Order')")

        print("Waiting for WORKORDER_FORM...")
        page.wait_for_selector("text=PRE WORK ORDER", timeout=5000)

        page.screenshot(path="verification/debug_workorder_view.png")

        print("Interacting with chips...")
        page.click("input[placeholder='Buscar...']")
        page.fill("input[placeholder='Buscar...']", "Juan")

        page.wait_for_selector(".list-group-item:has-text('Juan Perez')", timeout=3000)
        page.click(".list-group-item:has-text('Juan Perez')")

        page.wait_for_selector(".user-chip:has-text('Juan Perez')")
        print("Chip added.")

        # Add Maria
        page.fill("input[placeholder='Buscar...']", "Maria")
        page.click(".list-group-item:has-text('Maria Lopez')")
        page.wait_for_selector(".user-chip:has-text('Maria Lopez')")

        page.screenshot(path="verification/workorder_filled.png")
        print("Final screenshot saved.")

if __name__ == "__main__":
    run()
