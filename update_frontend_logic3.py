with open('index.html', 'r') as f:
    html = f.read()

# Replace using string replace to avoid regex sub escape issues
old_getProcessStatus = """      const getProcessStatus = (row) => {
          let val = row["MAP COT"];
          if (!val) val = row.PROCESO; // Fallback
          if (!val) return PROCESS_STEPS[0];
          if (LEGACY_PROCESS_MAP[val]) {
              val = LEGACY_PROCESS_MAP[val];
          }
          return val;
      };"""

generate_emoji_timeline_func = """      const generateEmojiTimeline = (row) => {
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
          } else {
              let mapCot = row["MAP COT"] || row.PROCESO;
              if (mapCot) {
                  if (mapCot.includes('🔴')) {
                     const match = mapCot.match(/🔴\\s*([A-Z]+)/);
                     if (match) currentStepId = match[1];
                  } else {
                     currentStepId = mapCot;
                  }
              }
          }
          if (LEGACY_PROCESS_MAP[currentStepId]) {
              currentStepId = LEGACY_PROCESS_MAP[currentStepId];
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
      };"""

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
              let mapCot = row["MAP COT"] || row.PROCESO;
              if (mapCot) {
                  if (mapCot.includes('🔴')) {
                     const match = mapCot.match(/🔴\\s*([A-Z]+)/);
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

html = html.replace(old_getProcessStatus, generate_emoji_timeline_func + "\n\n" + new_getProcessStatus)

with open('index.html', 'w') as f:
    f.write(html)
