import re

with open('index.html', 'r') as f:
    content = f.read()

# Replace header "PROCESO" with "MAP COT" in HOT_POTATO view
content = content.replace('<th style="width: auto;">PROCESO</th>', '<th style="width: auto;">MAP COT</th>')

# Replace getProcessStatus to use MAP COT
content = content.replace('let val = row.PROCESO;', 'let val = row["MAP COT"];\n          if (!val) val = row.PROCESO; // Fallback')

# Replace row.PROCESO = nextStep; with row["MAP COT"] = nextStep;
content = content.replace('row.PROCESO = nextStep;', 'row["MAP COT"] = nextStep;')

# We also need to add MAP COT to getColumnStyle to have width: auto;
content = content.replace("else if (currentUsername.value === 'ANTONIA_VENTAS' && (up === 'ESTATUS' || up === 'STATUS')) { w = '180px'; }",
                          "else if (currentUsername.value === 'ANTONIA_VENTAS' && (up === 'ESTATUS' || up === 'STATUS')) { w = '180px'; }\n          else if (currentUsername.value === 'ANTONIA_VENTAS' && up === 'MAP COT') { w = 'auto'; }")

# Adjust tracking logic where row[h] displays standard text if not matched by any other rule
# Look for the rendering loop:
loop_str = """
                            <div v-else-if="String(h).toUpperCase().includes('AVANCE')" style="text-align:center; font-weight:bold; color:#217346;">
                                {{ row[h] }}%
                            </div>
                            <div v-else-if="isCol(h, ['ESTATUS','STATUS']) && currentUsername === 'ANTONIA_VENTAS'"
"""

replacement_str = """
                            <div v-else-if="String(h).toUpperCase().includes('AVANCE')" style="text-align:center; font-weight:bold; color:#217346;">
                                {{ row[h] }}%
                            </div>
                            <div v-else-if="String(h).toUpperCase() === 'MAP COT' && currentUsername === 'ANTONIA_VENTAS'" class="p-1">
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
                            </div>
                            <div v-else-if="isCol(h, ['ESTATUS','STATUS']) && currentUsername === 'ANTONIA_VENTAS'"
"""

content = content.replace(loop_str.strip(), replacement_str.strip())


with open('index.html', 'w') as f:
    f.write(content)
