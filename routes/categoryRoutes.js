const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware'); // Ensure authentication
const CategoryController = require('../controllers/categoryController');

// Create an instance of CategoryController
const categoryController = new CategoryController();

// Route to get all categories
router.get('/', categoryController.getCategories.bind(categoryController));

// Route to get a single category by ID
router.get('/:id', categoryController.getCategoryById.bind(categoryController));

// Route to create a new category
router.post('/', authMiddleware, categoryController.createCategory.bind(categoryController));

// Route to update a category
router.put('/:id', authMiddleware, categoryController.updateCategory.bind(categoryController));

// Route to delete a category
router.delete('/:id', authMiddleware, categoryController.deleteCategory.bind(categoryController));

module.exports = router;
