const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const { authenticateJWT } = require('../middleware/auth');

// Protect all calendar routes
router.use(authenticateJWT);

router.get('/events', calendarController.getEvents);
router.get('/upcoming', calendarController.getUpcoming);
router.get('/events/:date', calendarController.getEventsByDate);
router.post('/events', calendarController.createEvent);
router.put('/events/:id', calendarController.updateEvent);
router.delete('/events/:id', calendarController.deleteEvent);

module.exports = router;
