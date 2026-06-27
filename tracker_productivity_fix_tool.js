const fs = require('fs');

function fixBugs() {
  let html = fs.readFileSync('index.html', 'utf8');

  // Add the declaration for tpFilters
  const varCode = `const tpFilters = Vue.ref({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
      const trackerProductivityData = Vue.ref(null);
      const isLoadingTrackerProductivity = Vue.ref(false);`;

  html = html.replace("const trackerProductivityData = ref(null);\n      const isLoadingTrackerProductivity = ref(false);", varCode);

  fs.writeFileSync('index.html', html, 'utf8');
}

fixBugs();
