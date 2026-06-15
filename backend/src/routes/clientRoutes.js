const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

// options endpoint must be before /:id parameter to avoid dynamic matching conflict
router.get('/options', clientController.getClientOptions);
router.get('/', clientController.getAllClients);
router.post('/', clientController.createClient);

router.get('/:id', clientController.getClientById);
router.put('/:id', clientController.updateClient);
router.delete('/:id', clientController.deleteClient);
router.get('/:id/projects', clientController.getClientProjects);

module.exports = router;
