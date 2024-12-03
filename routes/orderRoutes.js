const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware'); // Ensure authentication
const OrderController = require('../controllers/orderController');

// Create an instance of OrderController
const orderController = new OrderController();

// Route to create a new order
router.post('/', authMiddleware, orderController.createOrder.bind(orderController));

// Route to get all orders of user
router.get('/', authMiddleware, orderController.getOrderList.bind(orderController));

// Route to get the status of an order
router.get('/:orderId/status', authMiddleware, orderController.getOrderStatus.bind(orderController));

// Route to get order details
router.get('/:orderId', authMiddleware, orderController.getOrderDetails.bind(orderController));

// Route to update order
router.put('/:orderId', authMiddleware, orderController.updateOrderStatus.bind(orderController));

module.exports = router;
