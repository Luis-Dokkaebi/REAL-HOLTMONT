import re

with open('index.html', 'r') as f:
    html = f.read()

# Fix python escape character issue
new_getProcessStatus = r"""      const getProcessStatus = (row) => {
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

html = re.sub(
    r'const getProcessStatus = \(row\) => \{.*?\};',
    new_getProcessStatus,
    html,
    flags=re.DOTALL
)

with open('index.html', 'w') as f:
    f.write(html)
