const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware'); // Ensure authentication
const CartController = require('../controllers/cartController');

// Create an instance of CartController
const cartController = new CartController();

// Route to get the cart for a user
router.get('/', authMiddleware, cartController.getCart.bind(cartController));

// Route to add an item to the cart
router.post('/add-item', authMiddleware, cartController.addToCart.bind(cartController));

// Route to update an item in the cart
router.put('/update-item', authMiddleware, cartController.updateCartItem.bind(cartController));

// Route to remove an item from the cart
router.delete('/remove-item/:itemId', authMiddleware, cartController.removeFromCart.bind(cartController));

// Route to remove an item from the cart
router.delete('/', authMiddleware, cartController.clearCart.bind(cartController));

module.exports = router;
