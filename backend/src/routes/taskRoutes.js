const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticateJWT } = require('../middleware/auth');

// All task routes require authentication
router.use(authenticateJWT);

router.get('/', taskController.getAllTasks);
router.get('/my-tasks', taskController.getMyTasks);
router.get('/filter-options', taskController.getFilterOptions);
router.post('/', taskController.createTask);
router.put('/:taskId', taskController.updateTask);
router.delete('/:taskId', taskController.deleteTask);
router.patch('/:taskId/status', taskController.updateTaskStatusOnly);

module.exports = router;
