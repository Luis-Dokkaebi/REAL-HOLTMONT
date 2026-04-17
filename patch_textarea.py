with open("index.html", "r") as f:
    content = f.read()

search = """                         <textarea v-else-if="currentUsername === 'ANTONIA_VENTAS' && (String(h).toUpperCase() === 'CONCEPTO' || String(h).toUpperCase().includes('DESCRIP') || String(h).toUpperCase().includes('COMENTARIO'))" v-model="row[h]" :readonly="!isFieldEditable(h, row)" rows="2" spellcheck="true"></textarea>"""

replace = """                         <textarea v-else-if="(String(h).toUpperCase().includes('COMENTARIO') || String(h).toUpperCase().includes('PREVIOS') || String(h).toUpperCase().includes('OBSERVACIONES')) || (currentUsername === 'ANTONIA_VENTAS' && (String(h).toUpperCase() === 'CONCEPTO' || String(h).toUpperCase().includes('DESCRIP')))" v-model="row[h]" class="excel-textarea" :readonly="!isFieldEditable(h, row)" rows="2" spellcheck="true"></textarea>"""

content = content.replace(search, replace)

search_width = "else if (currentUsername.value === 'ANTONIA_VENTAS' && up === 'COMENTARIOS') { w = '200px'; }"
replace_width = "else if (up.includes('COMENTARIO') || up.includes('PREVIOS') || up.includes('OBSERVACIONES')) { w = '200px'; }"

content = content.replace(search_width, replace_width)

with open("index.html", "w") as f:
    f.write(content)
