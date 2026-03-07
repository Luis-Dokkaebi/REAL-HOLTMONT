import re

with open('CODIGO.js', 'r') as f:
    content = f.read()

# We want to reorder cleanHeaders before returning from internalFetchSheetData
# Let's find "return { \n      success: true, \n      data:" etc

def modify_headers_order(text):
    search = r"    return \{ \n      success: true, \n      data: activeTasks\.sort\(dateSorter\)\.map\(\(\{\_sortDate, \.\.\.rest\}\) => rest\), \n      history: historyTasks\.sort\(dateSorter\)\.map\(\(\{\_sortDate, \.\.\.rest\}\) => rest\), \n      headers: cleanHeaders \n    \};"
    replace = """
    if (sheetName.includes('ANTONIA_VENTAS')) {
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
    }

    return {
      success: true,
      data: activeTasks.sort(dateSorter).map(({_sortDate, ...rest}) => rest),
      history: historyTasks.sort(dateSorter).map(({_sortDate, ...rest}) => rest),
      headers: cleanHeaders
    };"""
    return re.sub(search, replace, text)

new_content = modify_headers_order(content)

with open('CODIGO.js', 'w') as f:
    f.write(new_content)
