const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware'); // Ensure authentication
const UserController = require('../controllers/userController');

// Create an instance of UserController
const userController = new UserController();

// Route to get a single user by ID
router.get('/', authMiddleware, userController.getUserById.bind(userController));

// Route to create a new user
router.post('/', userController.createUser.bind(userController));

// Route to update user details
router.put('/:id', authMiddleware, userController.updateUser.bind(userController));

// Route to delete a user
router.delete('/:id', authMiddleware, userController.deleteUser.bind(userController));

module.exports = router;
