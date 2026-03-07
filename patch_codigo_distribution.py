import re

file_path = 'CODIGO.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update internalUpdateTask distribution logic
if "delete distData['PROCESO_LOG'];" not in content:
    # First place (Antonia distribution)
    content = content.replace(
        "const distData = JSON.parse(JSON.stringify(taskData));\n             delete distData._rowIndex;",
        "const distData = JSON.parse(JSON.stringify(taskData));\n             delete distData._rowIndex;\n             delete distData['PROCESO_LOG'];\n             delete distData['MAP COT'];\n             delete distData['PROCESO'];"
    )

    # Second place (Reverse Sync distribution in internalUpdateTask)
    content = content.replace(
        "const syncData = JSON.parse(JSON.stringify(taskData));\n                 delete syncData._rowIndex;",
        "const syncData = JSON.parse(JSON.stringify(taskData));\n                 delete syncData._rowIndex;\n                 delete syncData['PROCESO_LOG'];\n                 delete syncData['MAP COT'];\n                 delete syncData['PROCESO'];"
    )

    # Third place (apiSaveTrackerBatch - Antonia distribution)
    content = content.replace(
        "const distData = JSON.parse(JSON.stringify(taskData));\n             delete distData._rowIndex;\n             distributionTasks.push(distData);",
        "const distData = JSON.parse(JSON.stringify(taskData));\n             delete distData._rowIndex;\n             delete distData['PROCESO_LOG'];\n             delete distData['MAP COT'];\n             delete distData['PROCESO'];\n             distributionTasks.push(distData);"
    )

    # Fourth place (apiSaveTrackerBatch - Reverse Sync distribution)
    # Wait, the third and fourth replace blocks would be caught by the same pattern:
    # But wait! I replaced the internalUpdateTask string which was:
    # const distData = JSON.parse(JSON.stringify(taskData));
    # delete distData._rowIndex;
    # But let's write a targeted script to replace them exactly.

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied to CODIGO.js successfully.")
