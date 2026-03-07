import re

with open('index.html', 'r') as f:
    html = f.read()

# 1. Update advanceProcess to inject emojis into MAP COT
# Replace row["MAP COT"] = nextStep; with emojis

old_advance = """                      row["MAP COT"] = nextStep;"""
new_advance = """
                      // Actualizamos log primero
                      let log = [];
                      try {
                          log = row.PROCESO_LOG ? JSON.parse(row.PROCESO_LOG) : [];
                      } catch(e) { log = []; }

                      if (!Array.isArray(log)) log = [];

                      log.push({
                          from: current,
                          to: nextStep,
                          timestamp: new Date().toISOString()
                      });

                      row.PROCESO_LOG = JSON.stringify(log);

                      // Generar emojis para Google Sheets
                      row["MAP COT"] = generateEmojiTimeline(row);
"""

# The advanceProcess function has log.push further down, we should replace the whole logical block.

# Find advanceProcess
match = re.search(r'const advanceProcess = \(row\) => \{.*?Swal\.fire.*?then\(\(result\) => \{.*?if \(result\.isConfirmed\) \{(.*?)\} \).*?\}', html, re.DOTALL)
if match:
    block = match.group(1)
    new_block = block.replace('row["MAP COT"] = nextStep;', '// row["MAP COT"] handled below')
    # find where log is saved
    new_block = new_block.replace('row.PROCESO_LOG = JSON.stringify(log);', 'row.PROCESO_LOG = JSON.stringify(log);\n                      row["MAP COT"] = generateEmojiTimeline(row);')
    html = html.replace(block, new_block)

# 2. Update saveRow to ensure emojis are generated before saving if ANTONIA_VENTAS
save_row_patch = """      const saveRow = (row, e) => {
          if (e) {
              e.preventDefault();
              e.stopPropagation();
          }
          if (row._isSaving) return;

          if (currentUsername.value === 'ANTONIA_VENTAS') {
              if (row.PROCESO_LOG || row["MAP COT"]) {
                  row["MAP COT"] = generateEmojiTimeline(row);
              }
          }
"""
html = html.replace("      const saveRow = (row, e) => {\n          if (e) {\n              e.preventDefault();\n              e.stopPropagation();\n          }\n          if (row._isSaving) return;", save_row_patch)


with open('index.html', 'w') as f:
    f.write(html)
print("Emojis injected on save.")
