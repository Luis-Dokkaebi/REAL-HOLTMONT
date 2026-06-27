const fs = require('fs');

function addFunctions() {
  let html = fs.readFileSync('index.html', 'utf8');

  const varCode = "const trackerProductivityData = Vue.ref(null);\n      const isLoadingTrackerProductivity = Vue.ref(false);";
  if(!html.includes("isLoadingTrackerProductivity = Vue.ref(false)")) {
      html = html.replace("const isLoggedIn = Vue.ref(false);", "const isLoggedIn = Vue.ref(false);\n      " + varCode);
  }

  fs.writeFileSync('index.html', html, 'utf8');
}

addFunctions();
