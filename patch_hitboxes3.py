import re

with open('index.html', 'r') as f:
    html = f.read()

# Replace PRIORIDAD and RIESGO and CLASIFICACION (they look very similar)
old_prio = """                         <div v-else-if="String(h).toUpperCase().includes('PRIORIDAD') || String(h).toUpperCase().includes('PRIO')" style="position:relative; width:100%; height:100%;">
                             <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none; font-size:10px; font-weight:bold;">{{ row[h] }}</div>
                             <select v-model="row[h]" :disabled="!isFieldEditable(h, row)" style="position:absolute; inset:0; width:100%; height:100%; opacity:0; cursor:pointer;"><option value="">-</option><option value="NORMAL">NORMAL</option><option value="MEDIA">MEDIA</option><option value="ALTA">ALTA</option><option value="URGENTE">URGENTE</option><option value="ESTRATEGICA">ESTRATEGICA</option></select>
                         </div>"""

new_prio = """                         <div v-else-if="String(h).toUpperCase().includes('PRIORIDAD') || String(h).toUpperCase().includes('PRIO')" class="editable-cell">
                             <div class="editable-hitbox base-white" tabindex="0">
                                 <div class="hitbox-text" style="width:100%; text-align:center;">{{ row[h] }}</div>
                                 <i class="fas fa-chevron-down hitbox-icon" style="position:absolute; right:8px;"></i>
                                 <select v-model="row[h]" :disabled="!isFieldEditable(h, row)" class="hitbox-input"><option value="">-</option><option value="NORMAL">NORMAL</option><option value="MEDIA">MEDIA</option><option value="ALTA">ALTA</option><option value="URGENTE">URGENTE</option><option value="ESTRATEGICA">ESTRATEGICA</option></select>
                             </div>
                         </div>"""
html = html.replace(old_prio, new_prio)


old_riesgo = """                         <div v-else-if="String(h).toUpperCase().includes('RIESGO')" style="position:relative; width:100%; height:100%;">
                             <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none; font-size:10px; font-weight:bold;">{{ row[h] }}</div>
                             <select v-model="row[h]" :disabled="!isFieldEditable(h, row)" style="position:absolute; inset:0; width:100%; height:100%; opacity:0; cursor:pointer;"><option value="">-</option><option value="BAJO">BAJO</option><option value="MEDIO">MEDIO</option><option value="ALTO">ALTO</option><option value="CRITICO">CRITICO</option></select>
                         </div>"""

new_riesgo = """                         <div v-else-if="String(h).toUpperCase().includes('RIESGO')" class="editable-cell">
                             <div class="editable-hitbox base-white" tabindex="0">
                                 <div class="hitbox-text" style="width:100%; text-align:center;">{{ row[h] }}</div>
                                 <i class="fas fa-chevron-down hitbox-icon" style="position:absolute; right:8px;"></i>
                                 <select v-model="row[h]" :disabled="!isFieldEditable(h, row)" class="hitbox-input"><option value="">-</option><option value="BAJO">BAJO</option><option value="MEDIO">MEDIO</option><option value="ALTO">ALTO</option><option value="CRITICO">CRITICO</option></select>
                             </div>
                         </div>"""
html = html.replace(old_riesgo, new_riesgo)

old_clasi = """                         <div v-else-if="isCol(h, ['CLASI','CLASIFICACION'])" style="position:relative; width:100%; height:100%;">
                             <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none; font-size:10px; font-weight:bold;">{{ row[h] }}</div>
                             <select v-model="row[h]" :disabled="!isFieldEditable(h, row)" style="position:absolute; inset:0; width:100%; height:100%; opacity:0; cursor:pointer;"><option value="">-</option><option value="A">A</option><option value="AA">AA</option><option value="AAA">AAA</option></select>
                         </div>"""

new_clasi = """                         <div v-else-if="isCol(h, ['CLASI','CLASIFICACION'])" class="editable-cell">
                             <div class="editable-hitbox base-white" tabindex="0">
                                 <div class="hitbox-text" style="width:100%; text-align:center;">{{ row[h] }}</div>
                                 <i class="fas fa-chevron-down hitbox-icon" style="position:absolute; right:8px;"></i>
                                 <select v-model="row[h]" :disabled="!isFieldEditable(h, row)" class="hitbox-input"><option value="">-</option><option value="A">A</option><option value="AA">AA</option><option value="AAA">AAA</option></select>
                             </div>
                         </div>"""
html = html.replace(old_clasi, new_clasi)


with open('index.html', 'w') as f:
    f.write(html)
