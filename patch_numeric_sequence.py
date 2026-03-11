import re

with open('CODIGO.js', 'r') as f:
    content = f.read()

# Update generateNumericSequence
search_block = """function generateNumericSequence(key) {
  const lock = LockService.getScriptLock();
  try {
    if (lock.tryLock(5000)) {
       const props = PropertiesService.getScriptProperties();
       let val = Number(props.getProperty(key) || 1000);
       val++;
       props.setProperty(key, String(val));
       return String(val);
    }
  } catch(e) { console.error(e); } finally { lock.releaseLock(); }
  return String(new Date().getTime());
}"""

replace_block = """function generateNumericSequence(key) {
  const lock = LockService.getScriptLock();
  try {
    if (lock.tryLock(5000)) {
       const props = PropertiesService.getScriptProperties();
       let val = Number(props.getProperty(key) || 1000);
       // Check if the value got corrupted (e.g., from a timestamp)
       if (val > 10000000) {
           val = 1000;
       }
       val++;
       props.setProperty(key, String(val));
       return String(val);
    }
  } catch(e) { console.error(e); } finally { lock.releaseLock(); }
  // Fallback to a random 4-digit number to avoid long timestamps
  return String(Math.floor(1000 + Math.random() * 9000));
}"""

if search_block in content:
    content = content.replace(search_block, replace_block)
    with open('CODIGO.js', 'w') as f:
        f.write(content)
    print("Patched generateNumericSequence successfully.")
else:
    print("Could not find the search block for generateNumericSequence.")
