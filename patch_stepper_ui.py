import re

with open('index.html', 'r') as f:
    html = f.read()

# Replace the inner stepper inside ESTATUS to show only the Badge view, since we moved the full stepper to the accordion.
# The current inner stepper:
old_estatus = """                                  <div style="flex: 1 1 auto; display:flex; align-items:center; background:#f8f9fa; border-top:1px solid #dee2e6;">
                                      <div class="hp-timeline-container w-100 m-0 py-1" style="min-height:40px;">
                                          <div v-for="(step, sIdx) in getProcessTimeline(row)" :key="sIdx" class="hp-step" @click="step.isCurrent ? advanceProcess(row) : null">
                                              <div class="hp-circle" :class="step.isDone ? 'green' : (step.isInProgress ? 'yellow' : 'red')" :title="getFullProcessName(step.id)">
                                                  <i v-if="step.isDone" class="fas fa-check"></i><i v-else-if="step.isInProgress" class="fas fa-user-clock"></i>
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

# For the badge view we need to find the currently active step (isInProgress) or the last completed step.
# `getProcessTimeline(row)` returns an array. Let's just create a computed helper or inline it, but inline is easiest if we iterate.
# Or better, just render a badge based on the status directly!
# The requirements say:
# "En lugar de mostrar los 8 círculos, muestra un solo bloque (Badge/Pill) altamente legible indicando exclusivamente el paso actual que requiere atención.
# Diseño del bloque actual:
# Icono o Emoji de estado (🔴, 🟡, 🟢).
# Texto descriptivo breve: "Pendiente: Eval. Técnica (EP)".
# Pequeño indicador de tiempo: "Hace 2h"."

# Let's replace the whole timeline div with a clean badge layout.

new_estatus = """                                  <div style="flex: 1 1 auto; display:flex; align-items:center; justify-content:center; background:#f8f9fa; border-top:1px solid #dee2e6; padding: 4px;">
                                      <template v-for="(step, sIdx) in getProcessTimeline(row)" :key="sIdx">
                                          <div v-if="step.isCurrent || (sIdx === getProcessTimeline(row).length - 1 && step.isDone) || (!step.isDone && getProcessTimeline(row).findIndex(s => !s.isDone) === sIdx)"
                                               class="hp-badge" :class="step.isDone ? 'green' : (step.isInProgress ? 'yellow' : 'red')"
                                               style="width: 100%; display: flex; justify-content: space-between; padding: 4px 8px; font-size: 9px; cursor: pointer;"
                                               @click="step.isCurrent ? advanceProcess(row) : null">
                                               <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{{ step.isDone ? '✔' : (step.isInProgress ? '⏳' : '🔴') }} {{ getFullProcessName(step.id) }}</span>
                                               <span style="opacity: 0.8; margin-left: 4px;">{{ step.timeLabel }}</span>
                                          </div>
                                      </template>
                                  </div>"""

html = html.replace(old_estatus, new_estatus)

with open('index.html', 'w') as f:
    f.write(html)
