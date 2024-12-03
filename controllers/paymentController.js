const Payment = require('../models/paymentSchema'); // Import Payment model
const Order = require('../models/orderSchema'); // Import Order model

class PaymentController {
    // Create a new payment
    async createPayment(req, res) {
        const { orderId, paymentMethod, amount, transactionId } = req.body;
        try {
            const order = await Order.findById(orderId).populate({
                path: 'items.product',
                select: 'name price description image'
            });
            if (!order) return res.status(404).json({ message: 'Order not found' });

            const newPayment = new Payment({
                order: orderId,
                payment_method: paymentMethod,
                amount,
                transaction_id: transactionId,
                status: 'completed' // Default status
            });

            await newPayment.save();
            order.status = 'confirmed';
            await order.save();
            for (const item of order.items) {

                const product = item.product;

                if (product) {
                    product.stock -= item.quantity;
                    await product.save();
                } else {
                    return res.status(404).json({ message: `Product with ID ${item.product} not found` });
                }
            }
            res.status(201).json(newPayment);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    // Get payment details
    async getPaymentDetails(req, res) {
        try {
            const payment = await Payment.findById(req.params.paymentId).populate('order');
            if (!payment) return res.status(404).json({ message: 'Payment not found' });
            res.json(payment);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
    async getAllPayment(req, res) {
        try {
            const payments = await Payment.find()
                .populate({
                    path: 'order',
                    match: { user: req.user.id }
                }).sort({ createdAt: -1 });

            const userPayments = payments.filter(payment => payment.order);

            if (!userPayments.length) {
                return res.status(404).json({ message: 'Payments not found' });
            }

            res.json(userPayments);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
}

module.exports = PaymentController;
