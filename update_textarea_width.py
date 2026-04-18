with open("index.html", "r") as f:
    content = f.read()

search_width = "else if (currentUsername.value === 'ANTONIA_VENTAS' && up === 'COMENTARIOS') { w = '200px'; }"
replace_width = "else if (up.includes('COMENTARIO')) { w = '200px'; textTransform = 'uppercase'; }"

print(search_width in content)
