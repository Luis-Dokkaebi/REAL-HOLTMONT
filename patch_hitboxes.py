import re

with open('index.html', 'r') as f:
    html = f.read()

# Replace the AREA / ESPECIALIDAD div
old_area = """                         <div v-if="isCol(h, ['AREA','ALTA','ESPECIALIDAD'])" style="position:relative; width:100%; height:100%;">
                             <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none; font-weight:bold; font-size:12px;">{{ row[h] ? String(row[h]).charAt(0).toUpperCase() : '' }}</div>
                             <select v-model="row[h]" :disabled="!isFieldEditable(h, row)" style="position:absolute; inset:0; width:100%; height:100%; opacity:0; cursor:pointer;"><option value="">-</option><option v-for="(dept, k) in (config.allDepartments || config.departments)" :key="k" :value="k">{{dept.label}}</option></select>
                         </div>"""

new_area = """                         <div v-if="isCol(h, ['AREA','ALTA','ESPECIALIDAD'])" class="editable-cell">
                             <div class="editable-hitbox base-white" tabindex="0">
                                 <div class="hitbox-text" style="width:100%; text-align:center;">{{ row[h] ? String(row[h]).charAt(0).toUpperCase() : '' }}</div>
                                 <i class="fas fa-chevron-down hitbox-icon" style="position:absolute; right:8px;"></i>
                                 <select v-model="row[h]" :disabled="!isFieldEditable(h, row)" class="hitbox-input"><option value="">-</option><option v-for="(dept, k) in (config.allDepartments || config.departments)" :key="k" :value="k">{{dept.label}}</option></select>
                             </div>
                         </div>"""
html = html.replace(old_area, new_area)

# Note: The codebase has CLASIFICACION or CLASI, but it is currently handled by: <input v-else v-model="row[h]"
# I will leave CLASI as a standard input for now unless it has a select list defined. The prompt specifically mentions dropdown. Let's see if we can find CLASI.
# It seems there's no custom dropdown for CLASI in the table body, it falls through to the generic input.

# Replace VENDEDOR
old_vendedor = """                         <div v-else-if="String(h).toUpperCase().includes('VENDEDOR') || (currentUsername === 'ANTONIA_VENTAS' && String(h).toUpperCase().includes('RESPONSABLE'))" style="position:relative; width:100%; height:100%; min-height: 30px; background-color:#f0fdf4;" @click="openVendorSelector(row, h)">
                             <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none; font-size:11px; white-space:nowrap; overflow:hidden; font-weight:bold; color:#000 !important;">{{ toInitials(row[h]) }}</div>
                         </div>"""

new_vendedor = """                         <div v-else-if="String(h).toUpperCase().includes('VENDEDOR') || (currentUsername === 'ANTONIA_VENTAS' && String(h).toUpperCase().includes('RESPONSABLE'))" class="editable-cell" style="min-height: 30px; background-color:#f0fdf4;">
                             <div class="editable-hitbox base-green" tabindex="0" @click="openVendorSelector(row, h)" @keydown.enter="openVendorSelector(row, h)" @keydown.space.prevent="openVendorSelector(row, h)">
                                 <div class="hitbox-text" style="width:100%; text-align:center; color:#000 !important;">{{ toInitials(row[h]) }}</div>
                                 <i class="fas fa-chevron-down hitbox-icon" style="color:#000; position:absolute; right:4px; font-size: 10px;"></i>
                             </div>
                         </div>"""
html = html.replace(old_vendedor, new_vendedor)

# Replace FECHA, etc.
old_dates = """                         <div v-else-if="String(h).toUpperCase().includes('FECHA') || String(h).toUpperCase().includes('ALTA') || String(h).toUpperCase().includes('F. ENTREGA') || String(h).toUpperCase().includes('F. VISITA') || String(h).toUpperCase().includes('F. INICIO')" style="position:absolute; inset:0; width:100%; height:100%; color: #000 !important;" :style="Object.assign({color: '#000'}, isCol(h, ['F. ENTREGA']) ? getTrafficStyle(row) : (isCol(h, ['FECHA RESPUESTA', 'FECHA DE RESPUESTA', 'FEC. EST. FIN', 'FECHA ESTIMADA DE FIN', 'FECHA DE ENTREGA']) ? getFechaRespuestaStyle(row) : getFechaInicioTrafficStyle(row)))">
                             <div style="position:absolute; inset:0; display:flex; align-items:center; padding-left:4px; font-size:12px; pointer-events:none; color: #000 !important;">{{ formatDisplayDate(row[h]) }}</div>
                             <input type="date" style="position:absolute; top:0; left:0; width:100%; height:100%; opacity:0; cursor:pointer;" :disabled="!isFieldEditable(h, row)" :value="toIsoDate(row[h])" @input="updateDateFromPicker($event, row, h)">
                         </div>"""

new_dates = """                         <div v-else-if="String(h).toUpperCase().includes('FECHA') || String(h).toUpperCase().includes('ALTA') || String(h).toUpperCase().includes('F. ENTREGA') || String(h).toUpperCase().includes('F. VISITA') || String(h).toUpperCase().includes('F. INICIO')" class="editable-cell" :style="Object.assign({color: '#000', backgroundColor: 'transparent'}, isCol(h, ['F. ENTREGA']) ? getTrafficStyle(row) : (isCol(h, ['FECHA RESPUESTA', 'FECHA DE RESPUESTA', 'FEC. EST. FIN', 'FECHA ESTIMADA DE FIN', 'FECHA DE ENTREGA']) ? getFechaRespuestaStyle(row) : getFechaInicioTrafficStyle(row)))">
                             <div class="editable-hitbox base-green" tabindex="0">
                                 <div class="hitbox-text" style="color: #000 !important;">{{ formatDisplayDate(row[h]) }}</div>
                                 <i class="fas fa-calendar-alt hitbox-icon" style="position:absolute; right:8px; color:rgba(255,255,255,0.7) !important;"></i>
                                 <input type="date" class="hitbox-input" :disabled="!isFieldEditable(h, row)" :value="toIsoDate(row[h])" @input="updateDateFromPicker($event, row, h)">
                             </div>
                         </div>"""
html = html.replace(old_dates, new_dates)

with open('index.html', 'w') as f:
    f.write(html)
