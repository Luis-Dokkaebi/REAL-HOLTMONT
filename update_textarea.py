with open("index.html", "r") as f:
    content = f.read()

search = """                         <textarea v-else-if="currentUsername === 'ANTONIA_VENTAS' && (String(h).toUpperCase() === 'CONCEPTO' || String(h).toUpperCase().includes('DESCRIP') || String(h).toUpperCase().includes('COMENTARIO'))" v-model="row[h]" :readonly="!isFieldEditable(h, row)" rows="2" spellcheck="true"></textarea>
                         <input v-else v-model="row[h]" :readonly="!isFieldEditable(h, row)" class="excel-input" :spellcheck="currentUsername === 'ANTONIA_VENTAS'">"""

replace = """                         <textarea v-else-if="String(h).toUpperCase().includes('COMENTARIO') || (currentUsername === 'ANTONIA_VENTAS' && (String(h).toUpperCase() === 'CONCEPTO' || String(h).toUpperCase().includes('DESCRIP')))" v-model="row[h]" :readonly="!isFieldEditable(h, row)" rows="2" spellcheck="true"></textarea>
                         <input v-else v-model="row[h]" :readonly="!isFieldEditable(h, row)" class="excel-input" :spellcheck="currentUsername === 'ANTONIA_VENTAS'">"""

print(search in content)
