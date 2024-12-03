const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware'); // Ensure authentication
const addressController = require('../controllers/addressController');

router.post('/', authMiddleware, addressController.create.bind(addressController));
router.get('/', authMiddleware,addressController.getByUser.bind(addressController));
router.get('/:id', authMiddleware, addressController.getById.bind(addressController));
router.put('/:id', authMiddleware, addressController.update.bind(addressController));
router.delete('/:id', authMiddleware, addressController.delete.bind(addressController));
router.patch('/:id/set-default', authMiddleware, addressController.setDefault.bind(addressController));

module.exports = router;