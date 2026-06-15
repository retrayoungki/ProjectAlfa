const express = require('express');
const router = express.Router();
const timesheetController = require('../controllers/timesheetController');
const { authenticateJWT, requireRoles } = require('../middleware/auth');

// Apply JWT authentication to all routes
router.use(authenticateJWT);

// PM/Admin specific routes (placed before parameter routes)
router.get('/pending', requireRoles(['ADMIN', 'PROJECT_MANAGER', 'SENIOR_PROJECT_MANAGER']), timesheetController.getPendingTimesheets);
router.patch('/approve-bulk', requireRoles(['ADMIN', 'PROJECT_MANAGER', 'SENIOR_PROJECT_MANAGER']), timesheetController.approveBulk);
router.get('/export', timesheetController.exportTimesheets); // export can be done by anyone, filtered inside controller if not PM/Admin
router.get('/log', timesheetController.getTimesheetLog);

// Standard CRUD endpoints
router.get('/', timesheetController.getTimesheets);
router.post('/', timesheetController.createTimesheet);
router.put('/:id', timesheetController.updateTimesheet);
router.delete('/:id', timesheetController.deleteTimesheet);

// PM/Admin action endpoints
router.patch('/:id/approve', requireRoles(['ADMIN', 'PROJECT_MANAGER', 'SENIOR_PROJECT_MANAGER']), timesheetController.approveTimesheet);
router.patch('/:id/reject', requireRoles(['ADMIN', 'PROJECT_MANAGER', 'SENIOR_PROJECT_MANAGER']), timesheetController.rejectTimesheet);

module.exports = router;
