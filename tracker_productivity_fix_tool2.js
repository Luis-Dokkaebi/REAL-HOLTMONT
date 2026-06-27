const fs = require('fs');

function fixBugs() {
  let html = fs.readFileSync('index.html', 'utf8');

  // Add the declaration for tpFilters
  const varCode = `const tpFilters = ref({ month: new Date().getMonth() + 1, year: new Date().getFullYear() }); const trackerProductivityData = ref(null); const isLoadingTrackerProductivity = ref(false); const loginPass = ref(''); const loginUser = ref(''); const loggingIn = ref(false); const currentUser = ref(''); const currentUsername = ref('');`;

  html = html.replace("const trackerProductivityData = ref(null); const isLoadingTrackerProductivity = ref(false); const loginPass = ref(''); const loginUser = ref(''); const loggingIn = ref(false); const currentUser = ref(''); const currentUsername = ref('');", varCode);

  fs.writeFileSync('index.html', html, 'utf8');
}

fixBugs();
