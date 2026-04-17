with open("index.html", "r") as f:
    content = f.read()

# Make sure we don't accidentally match COMENTARIO in the other table rows if we already do
search_read_only = """                                    <div v-else-if="String(h).toUpperCase().includes('COMENTARIOS') || String(h).toUpperCase().includes('PREVIOS') || String(h).toUpperCase().includes('OBSERVACIONES')" class="text-start">
                                        <textarea v-model="row[h]" class="excel-textarea" rows="2" spellcheck="false" style="text-align:left;"></textarea>
                                    </div>"""

replace_read_only = """                                    <div v-else-if="String(h).toUpperCase().includes('COMENTARIO') || String(h).toUpperCase().includes('PREVIOS') || String(h).toUpperCase().includes('OBSERVACIONES')" class="text-start">
                                        <textarea v-model="row[h]" class="excel-textarea" rows="2" spellcheck="false" style="text-align:left;"></textarea>
                                    </div>"""

content = content.replace(search_read_only, replace_read_only)

with open("index.html", "w") as f:
    f.write(content)
