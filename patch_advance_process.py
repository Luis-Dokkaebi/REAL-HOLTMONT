with open('index.html', 'r') as f:
    html = f.read()

old_block = """                      row["MAP COT"] = nextStep;

                      let log = [];
                      try {
                          log = row.PROCESO_LOG ? JSON.parse(row.PROCESO_LOG) : [];
                      } catch(e) { log = []; }

                      if (!Array.isArray(log)) log = [];

                      log.push({
                          from: current,
                          to: nextStep,
                          timestamp: new Date().getTime(),
                          dateStr: new Date().toLocaleString()
                      });

                      row.PROCESO_LOG = JSON.stringify(log);"""

new_block = """                      let log = [];
                      try {
                          log = row.PROCESO_LOG ? JSON.parse(row.PROCESO_LOG) : [];
                      } catch(e) { log = []; }

                      if (!Array.isArray(log)) log = [];

                      log.push({
                          from: current,
                          to: nextStep,
                          timestamp: new Date().getTime(),
                          dateStr: new Date().toLocaleString()
                      });

                      row.PROCESO_LOG = JSON.stringify(log);

                      if (currentUsername.value === 'ANTONIA_VENTAS') {
                          row["MAP COT"] = generateEmojiTimeline(row);
                      } else {
                          row["MAP COT"] = nextStep;
                      }"""

if old_block in html:
    html = html.replace(old_block, new_block)
    with open('index.html', 'w') as f:
        f.write(html)
    print("Patched advanceProcess")
else:
    print("Could not find old block in advanceProcess")
