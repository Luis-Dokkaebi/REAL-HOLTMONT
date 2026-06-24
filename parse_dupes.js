const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const saveFuncMatches = html.match(/apiSaveTrackerBatch\(/g);
console.log('Calls to apiSaveTrackerBatch in index.html:', saveFuncMatches ? saveFuncMatches.length : 0);
