const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware'); // Ensure authentication
const ProductController = require('../controllers/productController');

// Create an instance of ProductController
const productController = new ProductController();

// Route to get all products
router.get('/', productController.getProducts.bind(productController));

// Route to get random products
router.get('/random', productController.getRandomProducts.bind(productController));

// Route to get a single product by ID
router.get('/:id', productController.getProductById.bind(productController));

// Route to create a new product
router.post('/', authMiddleware, productController.createProduct.bind(productController));

// Route to update a product
router.put('/:id', authMiddleware, productController.updateProduct.bind(productController));

// Route to delete a product
router.delete('/:id', authMiddleware, productController.deleteProduct.bind(productController));

module.exports = router;
