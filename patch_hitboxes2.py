import re

with open('index.html', 'r') as f:
    html = f.read()

old_vendedor = """                         <div v-else-if="String(h).toUpperCase().includes('VENDEDOR') || (currentUsername === 'ANTONIA_VENTAS' && String(h).toUpperCase().includes('RESPONSABLE'))" style="position:relative; width:100%; height:100%; min-height: 30px; background-color:#f0fdf4;" @click="openVendorSelector(row, h)">
                             <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:11px; white-space:nowrap; overflow:hidden; font-weight:bold; color:#000 !important; cursor:pointer;">{{ toInitials(row[h]) }}</div>
                         </div>"""

new_vendedor = """                         <div v-else-if="String(h).toUpperCase().includes('VENDEDOR') || (currentUsername === 'ANTONIA_VENTAS' && String(h).toUpperCase().includes('RESPONSABLE'))" class="editable-cell" style="min-height: 30px; background-color:#f0fdf4;">
                             <div class="editable-hitbox base-green" tabindex="0" @click="openVendorSelector(row, h)" @keydown.enter="openVendorSelector(row, h)" @keydown.space.prevent="openVendorSelector(row, h)">
                                 <div class="hitbox-text" style="width:100%; text-align:center; color:#000 !important;">{{ toInitials(row[h]) }}</div>
                                 <i class="fas fa-chevron-down hitbox-icon" style="color:#000; position:absolute; right:4px; font-size: 10px;"></i>
                             </div>
                         </div>"""

html = html.replace(old_vendedor, new_vendedor)

with open('index.html', 'w') as f:
    f.write(html)
