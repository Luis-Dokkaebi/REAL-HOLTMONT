with open('CODIGO.js', 'r') as f:
    code = f.read()

# Remove the block that specifically reorders MAP COT
reorder_block = """    if (sheetName.includes('ANTONIA_VENTAS')) {
        const estatusIdx = cleanHeaders.indexOf('ESTATUS');
        const mapCotIdx = cleanHeaders.indexOf('MAP COT');

        if (mapCotIdx !== -1) {
            cleanHeaders.splice(mapCotIdx, 1); // remove

            // Recalculate positions
            const estIdx2 = cleanHeaders.indexOf('ESTATUS');
            if (estIdx2 !== -1) {
                cleanHeaders.splice(estIdx2 + 1, 0, 'MAP COT');
            } else {
                cleanHeaders.push('MAP COT');
            }
        }
    }"""

if reorder_block in code:
    code = code.replace(reorder_block, "")

with open('CODIGO.js', 'w') as f:
    f.write(code)
print("Removed header reordering logic")
