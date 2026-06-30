const fs = require('fs');
let indexHtml = fs.readFileSync('index.html', 'utf8');

const searchMapCot = `
                         <div v-else-if="isCol(h, ['MAP COT', 'PROCESO'])" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; padding: 2px;">
                            <div class="hp-timeline-container" style="justify-content: center; padding: 0;">
                                <div v-for="(step, sIdx) in getProcessTimeline(row)" :key="sIdx" class="hp-step" @click="step.isCurrent ? advanceProcess(row) : null" style="margin-right: 5px; width: 45px;">
                                    <div class="hp-circle" :class="step.isDone ? 'green' : (step.isInProgress ? 'yellow' : 'red')" :title="getFullProcessName(step.id)" style="width: 24px; height: 24px; font-size: 10px;">
                                        <i v-if="step.isDone" class="fas fa-check"></i><i v-else-if="step.isInProgress" class="fas fa-user-clock"></i>
                                        <div class="hp-clock-icon" :class="step.isDone ? 'check-icon' : 'red-icon'" style="width: 10px; height: 10px; font-size: 6px; bottom: -2px; right: -2px;">
                                            <i class="fas" :class="step.isDone ? 'fa-check-circle' : 'fa-clock'"></i>
                                        </div>
                                    </div>
                                    <div class="hp-step-label" style="font-size: 9px; margin-top: 2px;">{{ step.id }}</div>
                                </div>
                            </div>
                         </div>
`;
console.log(indexHtml.includes(searchMapCot));
