import re

with open('CODIGO.js', 'r') as f:
    content = f.read()

# We want to reorder cleanHeaders before returning from internalFetchSheetData
# Let's find "return { success: true, data: filteredTasks.reverse(), headers: headers };"

def modify_headers_order(text):
    search = r"return \{ success: true, data: filteredTasks.reverse\(\), headers: headers \};"
    replace = """
    if (sheetName.includes('ANTONIA_VENTAS')) {
        const estatusIdx = headers.indexOf('ESTATUS');
        const avanceIdx = headers.indexOf('AVANCE');
        const mapCotIdx = headers.indexOf('MAP COT');

        if (mapCotIdx !== -1) {
            headers.splice(mapCotIdx, 1); // remove

            // Recalculate positions
            const estIdx2 = headers.indexOf('ESTATUS');
            if (estIdx2 !== -1) {
                headers.splice(estIdx2 + 1, 0, 'MAP COT');
            } else {
                headers.push('MAP COT');
            }
        }
    }
    return { success: true, data: filteredTasks.reverse(), headers: headers };
    """
    return re.sub(search, replace, text)

new_content = modify_headers_order(content)

with open('CODIGO.js', 'w') as f:
    f.write(new_content)
