const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware'); // Ensure authentication
const PaymentController = require('../controllers/paymentController');

// Create an instance of PaymentController
const paymentController = new PaymentController();

// Route to create a new payment
router.post('/', authMiddleware, paymentController.createPayment.bind(paymentController));

// Route to get payment details
router.get('/', authMiddleware, paymentController.getAllPayment.bind(paymentController));

// Route to get payment details
router.get('/:paymentId', authMiddleware, paymentController.getPaymentDetails.bind(paymentController));

module.exports = router;
