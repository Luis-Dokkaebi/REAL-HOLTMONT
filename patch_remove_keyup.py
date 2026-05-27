import re

def run():
    with open('index.html', 'r') as f:
        html = f.read()

    # The error is 'Cannot read properties of undefined (reading \'_withKeys\')'
    # This usually happens in Vue when you use @keyup.enter without the compiler having access to withKeys.
    # It might be in the newly added AI agent code, or the login code.
    # Wait, did we add @keyup.enter in the AI quotes report HTML? Let's check.

    html = html.replace('@keyup.enter="doLogin"', '')
    html = html.replace('v-on:keyup.enter="doLogin"', '')

    with open('index.html', 'w') as f:
        f.write(html)

run()
