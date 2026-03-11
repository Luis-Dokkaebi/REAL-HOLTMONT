import re

with open('CODIGO.js', 'r') as f:
    content = f.read()

# Update internalUpdateTask
search_block = """        if (isAntonia) {
             // 1. AUTO-INCREMENT FOLIO (Before Saving)
             if (!taskData['FOLIO'] && !taskData['ID']) {
                 // NEW TASK -> GENERATE ID
                 taskData['FOLIO'] = generateNumericSequence('ANTONIA_SEQ');
             } else {"""

replace_block = """        if (isAntonia) {
             // 1. AUTO-INCREMENT FOLIO (Before Saving)
             if (!taskData['FOLIO'] && !taskData['ID']) {
                 // NEW TASK -> GENERATE ID
                 const seqNum = generateNumericSequence('ANTONIA_SEQ_V2');
                 taskData['FOLIO'] = "AV-" + seqNum;
             } else {"""

if search_block in content:
    content = content.replace(search_block, replace_block)
    with open('CODIGO.js', 'w') as f:
        f.write(content)
    print("Patched internalUpdateTask successfully.")
else:
    print("Could not find the search block for internalUpdateTask.")
