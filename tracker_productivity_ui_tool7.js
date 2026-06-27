const fs = require('fs');

function addFunctions() {
  let html = fs.readFileSync('index.html', 'utf8');

  const varCode = "const trackerProductivityData = ref(null); const isLoadingTrackerProductivity = ref(false);";
  if(!html.includes("isLoadingTrackerProductivity = ref(false)")) {
      html = html.replace("const isLoggedIn = ref(false);", "const isLoggedIn = ref(false);\n      " + varCode);
  }

  fs.writeFileSync('index.html', html, 'utf8');
}

addFunctions();
