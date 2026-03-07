import re

with open('index.html', 'r') as f:
    html = f.read()

generate_emoji_timeline_func = """
      const generateEmojiTimeline = (row) => {
          let log = [];
          try {
              log = row.PROCESO_LOG ? JSON.parse(row.PROCESO_LOG) : [];
          } catch(e) { log = []; }
          if (!Array.isArray(log)) log = [];

          let currentStepId = PROCESS_STEPS[0];
          if (log.length > 0) {
              const lastLog = log[log.length - 1];
              if (lastLog.to) {
                  currentStepId = lastLog.to;
              }
          }

          const currentIdx = PROCESS_STEPS.indexOf(currentStepId);
          if (currentIdx === -1) currentStepId = PROCESS_STEPS[0];

          let parts = [];
          for (let i = 0; i < PROCESS_STEPS.length; i++) {
              let step = PROCESS_STEPS[i];
              if (i < currentIdx) {
                  parts.push('🟢 ' + step);
              } else if (i === currentIdx) {
                  parts.push('🔴 ' + step);
              } else {
                  parts.push('⚪ ' + step);
              }
          }
          return parts.join(' | ');
      };
"""

# Inject before getProcessStatus
html = html.replace("const getProcessStatus = (row) => {", generate_emoji_timeline_func + "\n      const getProcessStatus = (row) => {", 1)

# Now modify getProcessStatus to use the log for determining the step
new_getProcessStatus = """      const getProcessStatus = (row) => {
          let log = [];
          try {
              log = row.PROCESO_LOG ? JSON.parse(row.PROCESO_LOG) : [];
          } catch(e) { log = []; }
          if (!Array.isArray(log)) log = [];

          let val = null;
          if (log.length > 0) {
              const lastLog = log[log.length - 1];
              if (lastLog.to) {
                  val = lastLog.to;
              }
          }
          if (!val) {
              // try extracting from old text or legacy format if log is empty
              let mapCot = row["MAP COT"] || row.PROCESO;
              if (mapCot) {
                  // If it has emojis, extract the red one or green one
                  if (mapCot.includes('🔴')) {
                     const match = mapCot.match(/🔴\s*([A-Z]+)/);
                     if (match) val = match[1];
                  } else {
                     val = mapCot;
                  }
              }
          }
          if (!val) return PROCESS_STEPS[0];
          if (LEGACY_PROCESS_MAP[val]) {
              val = LEGACY_PROCESS_MAP[val];
          }
          return val;
      };"""

# Replace old getProcessStatus
html = re.sub(
    r'const getProcessStatus = \(row\) => \{.*?\};',
    new_getProcessStatus,
    html,
    flags=re.DOTALL
)

with open('index.html', 'w') as f:
    f.write(html)
