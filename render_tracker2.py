import re

html_content = open('index.html', 'r').read()

# find the <style> tags
style_tags = ""
for match in re.finditer(r'<style>.*?</style>', html_content, re.DOTALL):
    style_tags += match.group(0) + "\n"

# extract head links
links = ""
for match in re.finditer(r'<link.*?>', html_content):
    links += match.group(0) + "\n"


# Find the tracker section
tracker_section_match = re.search(r'<div v-if="currentView === \'STAFF_TRACKER\'" class="h-100 d-flex flex-column">(.*?)<!-- /Tracker View -->', html_content, re.DOTALL)
if tracker_section_match:
    tracker_content = tracker_section_match.group(1)
else:
    print("Could not find tracker section")
    exit(1)

static_html = f"""
<!DOCTYPE html>
<html>
<head>
    {links}
    {style_tags}
    <style>
      body {{ background-color: #1a1a1a; color: #fff; padding: 20px; }}
    </style>
</head>
<body>
    <div id="app">
        {tracker_content}
    </div>
</body>
</html>
"""

with open('static_tracker.html', 'w') as f:
    f.write(static_html)
