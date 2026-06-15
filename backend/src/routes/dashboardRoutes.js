const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/summary', dashboardController.getSummary);
router.post('/projects', dashboardController.createProject);

module.exports = router;
