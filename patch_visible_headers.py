import re

file_path = 'index.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add visibleTrackerHeaders computed property
if 'const visibleTrackerHeaders =' not in content:
    computed_prop = """
      const visibleTrackerHeaders = computed(() => {
          if (!staffTracker.value.headers) return [];
          return staffTracker.value.headers.filter(h => {
              const up = String(h).toUpperCase().trim();
              return up !== 'PROCESO_LOG' && up !== 'PROCESO';
          });
      });
"""
    # Find the right place to insert it (e.g., after `const filteredStaffTrackerData = computed(() => {`)
    insert_pos = content.find('const filteredStaffTrackerData = computed(() => {')
    if insert_pos != -1:
        content = content[:insert_pos] + computed_prop + '\n' + content[insert_pos:]

# Replace staffTracker.headers with visibleTrackerHeaders in the tracker table and history table
content = content.replace(
    '<th v-for="(h, idx) in staffTracker.headers" :key="idx" :style="getColumnStyle(h)">',
    '<th v-for="(h, idx) in visibleTrackerHeaders" :key="idx" :style="getColumnStyle(h)">'
)

content = content.replace(
    '<td v-for="(h, idx) in staffTracker.headers" :key="idx">',
    '<td v-for="(h, idx) in visibleTrackerHeaders" :key="idx">'
)

content = content.replace(
    '<td v-for="(h, idx) in staffTracker.headers" :key="idx" :style="getColumnStyle(h)">',
    '<td v-for="(h, idx) in visibleTrackerHeaders" :key="idx" :style="getColumnStyle(h)">'
)

# Export visibleTrackerHeaders from the setup function
if 'visibleTrackerHeaders' not in content[content.rfind('return {'):]:
    content = content.replace('return { focusReqInput,', 'return { visibleTrackerHeaders, focusReqInput,')


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied to index.html successfully.")
