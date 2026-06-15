const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');

router.post('/', documentController.uploadMiddleware, documentController.uploadDocument);
router.delete('/:id', documentController.deleteDocument);

module.exports = router;
