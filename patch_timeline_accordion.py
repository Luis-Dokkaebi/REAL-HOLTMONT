import re

with open('index.html', 'r') as f:
    html = f.read()

# I need to add an expand toggle button inside the ESTATUS / STATUS cell or somewhere in the row.
# The user spec says: "Trigger de Expansión: Al inicio de la fila (junto al número de ID o Folio) o al final de la celda de Estatus, se coloca un botón de control de expansión: un ícono de flecha lateral [ > ] que al hacer clic rota hacia abajo [ v ]."
# Let's add it to the row-num cell for the main tracker table, or ID/FOLIO.
# Let's modify the ID/FOLIO cell to include a toggle button.

old_id_folio = """                         <input v-else-if="isCol(h, ['ID','FOLIO'])" :value="row[h]" class="excel-input" readonly style="background-color:#f0f0f0; color:#555; text-align:center;">"""

# We can make ID/FOLIO cell relative and put an icon, but let's just make the ESTATUS cell have the expand logic.
# The specification also says: "Al hacer clic en el trigger, la fila inyecta dinámicamente una sub-fila completa justo debajo. Contenido de sub-fila: Ocupa el 100% del ancho de la tabla (usando colspan). En el centro, despliega el Stepper Lineal completo".
# Wait, currently the hp-timeline-container is rendered INSIDE the ESTATUS cell. The specification asks for an Accordion pattern.
# However, modifying the `tr` to conditionally insert a sub-row can break the table-layout or complicate Vue looping.
# An easier approach that meets the UX requirement (reduce row height) is to make the `.hp-timeline-container` itself collapsible INSIDE the cell, or just toggle between Badge and Stepper.
# If we toggle between Badge and Stepper inside the same cell, the cell height will animate. That's close enough and doesn't require complex colspan sub-rows.
# Let's do that: Toggle between Badge view and Stepper view inside the ESTATUS cell.

# The current ANTONIA ESTATUS cell looks like this:
"""                         <div v-else-if="isCol(h, ['ESTATUS','STATUS'])" style="width:100%; height:100%;">
                             <div v-if="currentUsername === 'ANTONIA_VENTAS'" class="d-flex flex-column h-100">
                                  <div style="flex: 0 0 auto; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:10px; font-weight:bold; padding:4px; text-align:center; white-space:normal; line-height:1.1; min-height: 25px;"
                                       :style="getAntoniaStatusStyle(row[h])"
                                       @click="openStatusSelector(row, h)">
                                      {{ row[h] }}
                                  </div>
                                  <div style="flex: 1 1 auto; display:flex; align-items:center; background:#f8f9fa; border-top:1px solid #dee2e6;">
                                      <div class="hp-timeline-container w-100 m-0 py-1" style="min-height:40px;">"""

# We'll update the `isCol(h, ['ESTATUS','STATUS'])` block.
# Actually, the user asked for a sub-row in the specs ("la fila inyecta dinámicamente una sub-fila completa justo debajo... (usando colspan)").
# Let's try to do the Accordion inside the cell first because a sub-row might mess up the layout if it's not structured properly in Vue. Or we can just add a `<tr>` after the main one.
# We have `<tr v-for="(row, i) in filteredStaffTrackerData" ...>`
# We cannot easily add a sibling `tr` in a standard `v-for` without `<template v-for>`.
# The current Vue loop is:
# `<tr v-for="(row, i) in filteredStaffTrackerData" ...> ... </tr>`
# To add an accordion row, we would change it to:
# `<template v-for="(row, i) in filteredStaffTrackerData" :key="i">
#     <tr :class="..."> ... </tr>
#     <tr v-if="row._isExpanded"> <td :colspan="visibleTrackerHeaders.length + 2"> ... stepper ... </td> </tr>
# </template>`

# Since the file is huge and doing multi-line regex replacements can be tricky, let's use a Python script with string replacement to change the structure.

old_loop_start = """                   <tr v-for="(row, i) in filteredStaffTrackerData" :key="i" :class="{'new-row-highlight': row._isNew, 'antonia-font': currentUsername === 'ANTONIA_VENTAS'}">"""
new_loop_start = """                   <template v-for="(row, i) in filteredStaffTrackerData" :key="i">
                   <tr :class="{'new-row-highlight': row._isNew, 'antonia-font': currentUsername === 'ANTONIA_VENTAS'}">"""

old_loop_end = """                      <td class="text-center" style="background:#f8f9fa"><button class="btn btn-link btn-sm p-0 text-success" @click="saveRow(row, $event)" :disabled="row._isSaving"><i class="fas" :class="row._isSaving ? 'fa-spinner fa-spin' : 'fa-save'"></i></button></td>
                   </tr>"""
new_loop_end = """                      <td class="text-center" style="background:#f8f9fa"><button class="btn btn-link btn-sm p-0 text-success" @click="saveRow(row, $event)" :disabled="row._isSaving"><i class="fas" :class="row._isSaving ? 'fa-spinner fa-spin' : 'fa-save'"></i></button></td>
                   </tr>
                   <tr v-if="row._isExpanded">
                       <td :colspan="visibleTrackerHeaders.length + 2" class="p-3 bg-light border-bottom">
                           <div class="d-flex justify-content-center">
                               <div class="hp-timeline-container w-100" style="max-width: 800px; padding: 20px 0;">
                                   <div class="hp-stepper-line"></div>
                                   <div v-for="(step, sIdx) in getProcessTimeline(row)" :key="sIdx" class="hp-step" @click="step.isCurrent ? advanceProcess(row) : null" style="flex: 1; display: flex; justify-content: center; position: relative;">
                                       <div class="hp-circle-wrapper">
                                           <div class="hp-circle" :class="step.isDone ? 'green' : (step.isInProgress ? 'yellow' : 'red')" :style="{'box-shadow': '0 0 0 4px #f8f9fa'}">
                                               <span style="font-size: 12px; font-weight: bold; color: inherit;" :style="{color: step.isInProgress ? '#000' : '#fff'}">{{ step.id }}</span>
                                           </div>
                                           <div class="hp-tooltip">
                                               <div class="fw-bold mb-1">{{ getFullProcessName(step.id) }}</div>
                                               <div>{{ step.isDone ? 'Completado' : (step.isInProgress ? 'En Proceso' : 'Pendiente') }}</div>
                                               <div class="text-white-50 mt-1" style="font-size: 9px;">{{ step.timeLabel }}</div>
                                           </div>
                                       </div>
                                   </div>
                               </div>
                           </div>
                       </td>
                   </tr>
                   </template>"""

html = html.replace(old_loop_start, new_loop_start)
html = html.replace(old_loop_end, new_loop_end)

# Add the trigger to the ID/FOLIO cell
old_id_folio = """                         <input v-else-if="isCol(h, ['ID','FOLIO'])" :value="row[h]" class="excel-input" readonly style="background-color:#f0f0f0; color:#555; text-align:center;">"""
new_id_folio = """                         <div v-else-if="isCol(h, ['ID','FOLIO'])" class="d-flex align-items-center justify-content-center h-100" style="background-color:#f0f0f0; color:#555; gap: 4px;">
                             <i v-if="currentUsername === 'ANTONIA_VENTAS'" class="fas" :class="row._isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'" style="cursor: pointer; font-size: 10px;" @click="row._isExpanded = !row._isExpanded"></i>
                             <span>{{ row[h] }}</span>
                         </div>"""
html = html.replace(old_id_folio, new_id_folio)

with open('index.html', 'w') as f:
    f.write(html)
