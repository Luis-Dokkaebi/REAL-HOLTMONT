
from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()

        # Inject mock before page load
        context.add_init_script('''
            window.google = {
                script: {
                    run: {
                        withSuccessHandler: function(callback) {
                            const handlerObj = {
                                withFailureHandler: function(errCallback) {
                                    return {
                                        apiLogin: function(u, p) {
                                            if(u==='PREWORK_ORDER') {
                                                callback({success:true, username:'PREWORK_ORDER', role:'WORKORDER_USER', name:'Prework User'});
                                            } else {
                                                if(errCallback) errCallback({message:'Invalid credentials'});
                                            }
                                        },
                                        getSystemConfig: function(r) {
                                            callback({
                                                departments: { 'OBRA_CIVIL': { label: 'Obra Civil', color: '#ff0000', icon: 'fa-hard-hat' } },
                                                staff: [],
                                                directory: [{name:'Jesus Cantu', dept:'Admin'}],
                                                specialModules: [{id:'WORKORDER_FORM', type:'ppc_native', label:'Workorder', icon:'fa-clipboard', color:'#ff0000'}]
                                            });
                                        },
                                        apiFetchDrafts: function() { callback({success:true, data:[]}); },
                                        apiFetchStaffTrackerData: function() { callback({success:true, data:[], history:[], headers:[]}); },
                                        apiUpdateTask: function() { callback({success:true}); }
                                    };
                                },
                                apiGetNextWorkOrderSeq: function() {
                                    callback('0001');
                                },
                                apiFetchPPCData: function() {
                                    callback({success:true, data:[]});
                                },
                                apiFetchCascadeTree: function() {
                                    callback({success:true, data:[]});
                                },
                                getSystemConfig: function(r) {
                                    callback({
                                        departments: { 'OBRA_CIVIL': { label: 'Obra Civil', color: '#ff0000', icon: 'fa-hard-hat' } },
                                        staff: [],
                                        directory: [{name:'Jesus Cantu', dept:'Admin'}],
                                        specialModules: [{id:'WORKORDER_FORM', type:'ppc_native', label:'Workorder', icon:'fa-clipboard', color:'#ff0000'}]
                                    });
                                },
                                uploadFileToDrive: function(d,t,n) {
                                    callback({success:true, fileUrl:'http://mock.url/'+n});
                                },
                                apiSavePPCData: function(data, user) {
                                    callback({success:true, ids:['FOLIO-MOCK-123']});
                                }
                            };
                            return handlerObj;
                        },
                        apiLogout: function() {},
                        apiClearDrafts: function() {},
                        apiSyncDrafts: function() {}
                    }
                }
            };
        ''')

        page = context.new_page()

        try:
            # Load local HTML file
            page.goto('file://' + os.path.abspath('index.html'))

            # Wait for login input
            page.wait_for_selector('input[placeholder="Usuario"]', timeout=10000)

            # Login flow
            page.fill('input[placeholder="Usuario"]', 'PREWORK_ORDER')
            page.fill('input[placeholder="Contraseña..."]', '123')
            page.click('button:has-text("INICIAR SESIÓN")')

            # Wait for dashboard
            page.wait_for_selector('.dept-card', timeout=10000)
            print('Dashboard loaded')

            # Click Workorder Module
            page.click('.dept-card:has-text("Workorder")')

            # Wait for form to load (Mano de Obra section)
            page.wait_for_selector('text=MANO DE OBRA', timeout=10000)
            print('Workorder loaded')

            # Check for new elements
            page.wait_for_selector('.card-summary-blue', timeout=5000)
            print('New summary cards found')

            # Scroll to Labor section
            labor_section = page.locator('text=MANO DE OBRA').first
            labor_section.scroll_into_view_if_needed()

            page.wait_for_timeout(1000)
            page.screenshot(path='verification/verification_labor.png')
            print('Screenshot taken: verification/verification_labor.png')

            # Scroll to Footer
            footer_section = page.locator('text=KPIs DASHBOARD').first
            footer_section.scroll_into_view_if_needed()

            page.wait_for_timeout(1000)
            page.screenshot(path='verification/verification_footer.png')
            print('Screenshot taken: verification/verification_footer.png')

        except Exception as e:
            print(f'Error: {e}')
            try:
                page.screenshot(path='verification/error_screenshot.png')
                print('Error screenshot taken')
            except:
                pass

        finally:
            browser.close()

if __name__ == '__main__':
    run()
