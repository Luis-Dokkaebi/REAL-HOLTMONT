import re

file_path = 'CODIGO.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Revert deletion of MAP COT before distribution
content = content.replace("delete distData['MAP COT'];\n", "")
content = content.replace("delete syncData['MAP COT'];\n", "")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("MAP COT distribution restored in CODIGO.js")
