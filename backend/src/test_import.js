try {
  console.log('Testing backend server imports...');
  const routes = require('./routes/timesheetRoutes');
  console.log('Import of timesheetRoutes succeeded!');
  
  const server = require('./server');
  console.log('Import of server succeeded!');
} catch (err) {
  console.error('--- ERROR CAUGHT ---');
  console.error(err);
}
