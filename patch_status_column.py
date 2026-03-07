with open('index.html', 'r') as f:
    html = f.read()

# 1. Update ESTATUS column definition
# Find the line: else if (currentUsername.value === 'ANTONIA_VENTAS' && (up === 'ESTATUS' || up === 'STATUS')) { w = '180px'; }
html = html.replace(
    "else if (currentUsername.value === 'ANTONIA_VENTAS' && (up === 'ESTATUS' || up === 'STATUS')) { w = '180px'; }",
    "else if (currentUsername.value === 'ANTONIA_VENTAS' && (up === 'ESTATUS' || up === 'STATUS')) { w = '350px'; }"
)

# Also remove MAP COT specific width if it exists
html = html.replace("else if (currentUsername.value === 'ANTONIA_VENTAS' && up === 'MAP COT') { w = 'auto'; }", "")

# 2. Update ESTATUS column rendering in main table
old_estatus_block_main = """                         <div v-else-if="isCol(h, ['ESTATUS','STATUS'])" style="width:100%; height:100%;">
                             <div v-if="currentUsername === 'ANTONIA_VENTAS'"
                                  style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:10px; font-weight:bold; padding:0 4px; text-align:center; white-space:normal; line-height:1.1;"
                                  :style="getAntoniaStatusStyle(row[h])"
                                  @click="openStatusSelector(row, h)">
                                 {{ row[h] }}
                             </div>
                             <input v-else
                                    v-model="row[h]"
                                    :readonly="!isFieldEditable(h, row)"
                                    style="text-align:center; font-weight:bold; font-size:10px; width:100%; height:100%; border:none; outline:none; padding:6px 1px; background:transparent;"
                                    class="excel-input">
                         </div>"""

new_estatus_block_main = """                         <div v-else-if="isCol(h, ['ESTATUS','STATUS'])" style="width:100%; height:100%;">
                             <div v-if="currentUsername === 'ANTONIA_VENTAS'" class="d-flex flex-column h-100">
                                  <div style="flex: 0 0 auto; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:10px; font-weight:bold; padding:4px; text-align:center; white-space:normal; line-height:1.1; min-height: 25px;"
                                       :style="getAntoniaStatusStyle(row[h])"
                                       @click="openStatusSelector(row, h)">
                                      {{ row[h] }}
                                  </div>
                                  <div style="flex: 1 1 auto; display:flex; align-items:center; background:#f8f9fa; border-top:1px solid #dee2e6;">
                                      <div class="hp-timeline-container w-100 m-0 py-1" style="min-height:40px;">
                                          <div v-for="(step, sIdx) in getProcessTimeline(row)" :key="sIdx" class="hp-step" @click="step.isCurrent ? advanceProcess(row) : null">
                                              <div class="hp-circle" :class="step.isDone ? 'green' : 'red'" :title="getFullProcessName(step.id)">
                                                  <i v-if="step.isDone" class="fas fa-check"></i>
                                                  <div class="hp-clock-icon" :class="step.isDone ? 'check-icon' : 'red-icon'">
                                                      <i class="fas" :class="step.isDone ? 'fa-check-circle' : 'fa-clock'"></i>
                                                  </div>
                                              </div>
                                              <div class="hp-text">
                                                  {{ step.isDone ? 'Hecho' : 'Pendiente' }} {{ step.id }}<br>
                                                  <span class="hp-time">{{ step.timeLabel }}</span>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                             </div>
                             <input v-else
                                    v-model="row[h]"
                                    :readonly="!isFieldEditable(h, row)"
                                    style="text-align:center; font-weight:bold; font-size:10px; width:100%; height:100%; border:none; outline:none; padding:6px 1px; background:transparent;"
                                    class="excel-input">
                         </div>"""

html = html.replace(old_estatus_block_main, new_estatus_block_main)

# 3. Update MAP COT column rendering to just be an input or simple display if ANTONIA
# We remove the custom timeline block for MAP COT and let it fallback to the default input.
map_cot_custom_main = """                         <div v-else-if="String(h).toUpperCase() === 'MAP COT' && currentUsername === 'ANTONIA_VENTAS'" class="p-1" style="width:100%; height:100%; display:flex; align-items:center;">
                             <div class="hp-timeline-container w-100 m-0">
                                 <div v-for="(step, sIdx) in getProcessTimeline(row)" :key="sIdx" class="hp-step" @click="step.isCurrent ? advanceProcess(row) : null">
                                     <div class="hp-circle" :class="step.isDone ? 'green' : 'red'" :title="getFullProcessName(step.id)">
                                         <i v-if="step.isDone" class="fas fa-check"></i>
                                         <div class="hp-clock-icon" :class="step.isDone ? 'check-icon' : 'red-icon'">
                                             <i class="fas" :class="step.isDone ? 'fa-check-circle' : 'fa-clock'"></i>
                                         </div>
                                     </div>
                                     <div class="hp-text">
                                         {{ step.isDone ? 'Hecho' : 'Pendiente' }} {{ step.id }}<br>
                                         <span class="hp-time">{{ step.timeLabel }}</span>
                                     </div>
                                 </div>
                             </div>
                         </div>"""

html = html.replace(map_cot_custom_main, "")

# Same for HISTORY table
map_cot_custom_history = """                            <div v-else-if="String(h).toUpperCase() === 'MAP COT' && currentUsername === 'ANTONIA_VENTAS'" class="p-1">
                                  <div class="hp-timeline-container">
                                      <div v-for="(step, sIdx) in getProcessTimeline(row)" :key="sIdx" class="hp-step" @click="step.isCurrent ? advanceProcess(row) : null">
                                          <div class="hp-circle" :class="step.isDone ? 'green' : 'red'" :title="getFullProcessName(step.id)">
                                              <i v-if="step.isDone" class="fas fa-check"></i>
                                              <div class="hp-clock-icon" :class="step.isDone ? 'check-icon' : 'red-icon'">
                                                  <i class="fas" :class="step.isDone ? 'fa-check-circle' : 'fa-clock'"></i>
                                              </div>
                                          </div>
                                          <div class="hp-text">
                                              {{ step.isDone ? 'Hecho' : 'Pendiente' }} {{ step.id }}<br>
                                              <span class="hp-time">{{ step.timeLabel }}</span>
                                          </div>
                                      </div>
                                  </div>
                            </div>"""

html = html.replace(map_cot_custom_history, "")

# And update ESTATUS in History table
old_estatus_history = """                            <div v-else-if="isCol(h, ['ESTATUS','STATUS']) && currentUsername === 'ANTONIA_VENTAS'"
                                 style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:bold; padding:0 4px; text-align:center; white-space:normal; line-height:1.1;"
                                 :style="getAntoniaStatusStyle(row[h])">
                                {{ row[h] }}
                            </div>"""

new_estatus_history = """                            <div v-else-if="isCol(h, ['ESTATUS','STATUS']) && currentUsername === 'ANTONIA_VENTAS'" class="d-flex flex-column h-100">
                                 <div style="flex: 0 0 auto; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:bold; padding:4px; text-align:center; white-space:normal; line-height:1.1; min-height: 25px;"
                                      :style="getAntoniaStatusStyle(row[h])">
                                     {{ row[h] }}
                                 </div>
                                 <div style="flex: 1 1 auto; display:flex; align-items:center; background:#f8f9fa; border-top:1px solid #dee2e6;">
                                     <div class="hp-timeline-container w-100 m-0 py-1" style="min-height:40px;">
                                         <div v-for="(step, sIdx) in getProcessTimeline(row)" :key="sIdx" class="hp-step" @click="step.isCurrent ? advanceProcess(row) : null">
                                             <div class="hp-circle" :class="step.isDone ? 'green' : 'red'" :title="getFullProcessName(step.id)">
                                                 <i v-if="step.isDone" class="fas fa-check"></i>
                                                 <div class="hp-clock-icon" :class="step.isDone ? 'check-icon' : 'red-icon'">
                                                     <i class="fas" :class="step.isDone ? 'fa-check-circle' : 'fa-clock'"></i>
                                                 </div>
                                             </div>
                                             <div class="hp-text">
                                                 {{ step.isDone ? 'Hecho' : 'Pendiente' }} {{ step.id }}<br>
                                                 <span class="hp-time">{{ step.timeLabel }}</span>
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                            </div>"""

html = html.replace(old_estatus_history, new_estatus_history)

with open('index.html', 'w') as f:
    f.write(html)
