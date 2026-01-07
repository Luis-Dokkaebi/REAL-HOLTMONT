
import os
from playwright.sync_api import sync_playwright, expect

def verify_instr_toggles():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the local HTML file
        file_path = os.path.abspath("index.html")
        page.goto(f"file://{file_path}")

        # Mock GAS
        page.evaluate("""
            window.google = {
                script: {
                    run: {
                        withSuccessHandler: function(callback) {
                            return {
                                apiLogin: function(u, p) {
                                    callback({
                                        success: true,
                                        name: 'TEST USER',
                                        username: 'PREWORK_ORDER',
                                        role: 'WORKORDER_USER'
                                    });
                                    return this;
                                },
                                getSystemConfig: function() {
                                    callback({
                                        departments: {},
                                        staff: [],
                                        directory: [],
                                        specialModules: [{id: 'PPC_MASTER', type: 'ppc_native', label: 'Work Order', icon: 'fa-clipboard-list', color: '#007bff'}]
                                    });
                                    return this;
                                },
                                apiGetNextWorkOrderSeq: function() {
                                    callback('0001');
                                    return this;
                                },
                                apiFetchCascadeTree: function() {
                                    callback({success: true, data: []});
                                    return this;
                                },
                                withFailureHandler: function() { return this; }
                            };
                        },
                        withFailureHandler: function() { return this; },
                        apiLogin: function() {},
                        apiLogout: function() {}
                    }
                }
            };
        """)

        # Login
        page.fill('input[placeholder="Usuario"]', "PREWORK_ORDER")
        page.fill('input[placeholder="Contraseña..."]', "password")
        page.click('button:has-text("INICIAR SESIÓN")')

        # Open WorkOrder Form
        page.click('.dept-card', force=True)
        page.wait_for_selector('h4:has-text("Holtmont Services")', timeout=5000)

        # 1. Verify Instr blocks are hidden initially (icons visible)
        # Client Name Instr - Use First because the filter might still match too broadly if structure is complex,
        # but logically "Nombre de Cliente" should be unique enough in that specific card.
        # However, Playwright says 3 elements. This means my filter is not filtering enough or multiple elements inside match.
        # Let's target the input placeholder which is unique.

        # Target the icon next to the "Nombre de Cliente" input area.
        # Structure: col-md-6 > label(Nombre de Cliente) ... > div > i

        client_col = page.locator('div.col-md-6').filter(has=page.locator('label', has_text="Nombre de Cliente")).first
        client_icon = client_col.locator('i[title="Ver Instrucción"]').first
        client_text = client_col.locator('small:has-text("Instr: en automatico se va al folio")')

        expect(client_icon).to_be_visible()
        expect(client_text).not_to_be_visible()

        # 2. Click icon to show Instr
        client_icon.click()
        expect(client_text).to_be_visible()

        # 3. Verify ChatGPT logic toggle
        # The container has the ChatGPT link.
        chatgpt_container = page.locator('div.d-flex.flex-column.align-items-center').filter(has=page.locator('a[href*="chat.openai.com"]')).first
        chatgpt_icon = chatgpt_container.locator('i[title="Ver Lógica"]')
        chatgpt_text = chatgpt_container.locator('small:has-text("Lógica: que nos ayude a realizar una minuta")')

        expect(chatgpt_icon).to_be_visible()
        expect(chatgpt_text).not_to_be_visible()

        chatgpt_icon.click()
        expect(chatgpt_text).to_be_visible()

        # 4. Take Screenshot of expanded state
        page.screenshot(path="verification/verification_instr_toggles.png", full_page=True)

        browser.close()

if __name__ == "__main__":
    verify_instr_toggles()
