import re

with open('CODIGO.js', 'r') as f:
    content = f.read()

# Replace sequence key and auto-healing logic
search_block_1 = """      // Sequence Logic for Antonia
      let currentSeq = null;
      let seqKey = 'ANTONIA_SEQ';
      if (isAntonia) {
          const props = PropertiesService.getScriptProperties();
          currentSeq = Number(props.getProperty(seqKey) || 1000);

          // AUTO-HEALING: Scan batch for higher existing IDs to sync sequence
          tasks.forEach(t => {
              const fid = parseInt(t['FOLIO'] || t['ID']);
              if (!isNaN(fid) && fid > currentSeq) {
                  currentSeq = fid;
              }
          });
      }"""

replace_block_1 = """      // Sequence Logic for Antonia
      let currentSeq = null;
      let seqKey = 'ANTONIA_SEQ_V2';
      if (isAntonia) {
          const props = PropertiesService.getScriptProperties();
          currentSeq = Number(props.getProperty(seqKey) || 1000);

          // AUTO-HEALING: Scan batch for higher existing IDs to sync sequence
          tasks.forEach(t => {
              const folioVal = String(t['FOLIO'] || t['ID'] || "");
              if (folioVal.startsWith("AV-")) {
                  const numPart = folioVal.replace("AV-", "");
                  const fid = parseInt(numPart);
                  if (!isNaN(fid) && fid > currentSeq) {
                      currentSeq = fid;
                  }
              }
          });
      }"""

# Update taskData assignment
search_block_2 = """                 if (!hasContent) return; // SKIP EMPTY ROWS (Don't process, don't distribute)

                 currentSeq++;
                 taskData['FOLIO'] = String(currentSeq);
             } else {"""

replace_block_2 = """                 if (!hasContent) return; // SKIP EMPTY ROWS (Don't process, don't distribute)

                 currentSeq++;
                 taskData['FOLIO'] = "AV-" + String(currentSeq);
             } else {"""

if search_block_1 in content and search_block_2 in content:
    content = content.replace(search_block_1, replace_block_1)
    content = content.replace(search_block_2, replace_block_2)
    with open('CODIGO.js', 'w') as f:
        f.write(content)
    print("Patched apiSaveTrackerBatch successfully.")
else:
    print("Could not find the search blocks for apiSaveTrackerBatch.")
    if search_block_1 not in content:
        print("Block 1 not found.")
    if search_block_2 not in content:
        print("Block 2 not found.")
