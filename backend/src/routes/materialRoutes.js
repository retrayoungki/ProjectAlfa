const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');

router.get('/', materialController.getMaterials);
router.post('/', materialController.createMaterial);
router.get('/:id', materialController.getMaterialById);
router.put('/:id', materialController.updateMaterial);
router.delete('/:id', materialController.deleteMaterial);
router.get('/:id/history', materialController.getMaterialHistory);

module.exports = router;
