import re

with open('index.html', 'r') as f:
    content = f.read()

# Replace <th style="width: auto;">PROCESO</th>
content = content.replace('<th style="width: auto;">PROCESO</th>', '<th style="width: auto;">MAP COT</th>')
content = content.replace("row.PROCESO =", "row['MAP COT'] =")

# Find where it renders MAP COT and we want to change width auto as well
content = content.replace("else if (currentUsername.value === 'ANTONIA_VENTAS' && (up === 'ESTATUS' || up === 'STATUS')) { w = '180px'; }",
                          "else if (currentUsername.value === 'ANTONIA_VENTAS' && (up === 'ESTATUS' || up === 'STATUS')) { w = '180px'; }\n          else if (currentUsername.value === 'ANTONIA_VENTAS' && up === 'MAP COT') { w = 'auto'; }")


with open('index.html', 'w') as f:
    f.write(content)
