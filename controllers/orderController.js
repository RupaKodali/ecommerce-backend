const Order = require('../models/orderSchema');
const Cart = require('../models/cartSchema');
const Product = require('../models/productSchema');
const Payment = require('../models/paymentSchema');
const mongoose = require('mongoose');

class OrderController {
    // Create a new order with transaction support
    async createOrder(req, res) {
        try {
            const userId = req.user.id;

            // Validate user ID
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID format'
                });
            }

            // Find cart and validate
            const cart = await Cart.findOne({ user: userId });
            if (!cart || cart.items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cart is empty or not found'
                });
            }

            // Get product details and validate stock
            const productIds = cart.items.map(item => item.product);
            const products = await Product.find({ _id: { $in: productIds } });
            const productMap = new Map(products.map(p => [p._id.toString(), p]));

            // Validate products and calculate total
            let totalPrice = 0;
            const orderItems = [];

            for (const item of cart.items) {
                const product = productMap.get(item.product.toString());
                
                if (!product) {
                    return res.status(400).json({
                        success: false,
                        message: `Product not found: ${item.product}`
                    });
                }

                if (product.stock_quantity < item.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient stock for product: ${product.name}`
                    });
                }

                orderItems.push({
                    product: product._id,
                    quantity: item.quantity,
                    price: product.price,
                    subtotal: product.price * item.quantity
                });

                totalPrice += product.price * item.quantity;
            }

            // Create order first
            const newOrder = new Order({
                user: userId,
                items: orderItems,
                total_price: totalPrice,
                status: 'pending',
                shipping_address: req.body.shipping_address || null,
                notes: req.body.notes || null,
                estimated_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            });

            const savedOrder = await newOrder.save();

            // Clear cart last (if this fails, it's not critical)
            try {
                cart.items = [];
                await cart.save();
            } catch (cartError) {
                console.error('Failed to clear cart:', cartError);
                // Continue anyway since the order is already created
            }

            // Fetch complete order details
            const completeOrder = await Order.findById(savedOrder._id)
                .populate({
                    path: 'items.product',
                    select: 'name price description'
                })
                .populate('user', 'name email');

            res.status(201).json({
                success: true,
                message: 'Order created successfully',
                order: completeOrder
            });

        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Error creating order',
                error: err.message
            });
        }
    }

    // Get order status
    async getOrderStatus(req, res) {
        try {
            const { orderId } = req.params;

            // Validate order ID
            if (!mongoose.Types.ObjectId.isValid(orderId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid order ID format'
                });
            }

            const order = await Order.findById(orderId)
                .select('status')
                .lean();

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            res.json({
                success: true,
                orderStatus: order
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Error retrieving order status',
                error: err.message
            });
        }
    }

    // Get order details with payment information
    async getOrderDetails(req, res) {
        try {
            const { orderId } = req.params;

            // Validate order ID
            if (!mongoose.Types.ObjectId.isValid(orderId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid order ID format'
                });
            }

            const order = await Order.findById(orderId)
                .populate({
                    path: 'items.product',
                    // select: 'name price description image'
                })
                .populate('user', 'name email')
                .lean();

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            // Get payment information
            const payments = await Payment.find({ order: orderId })
                .sort({ createdAt: -1 })
                .lean();

            // Add payment status summary
            const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
            const paymentStatus = {
                totalPaid,
                remainingAmount: order.total_price - totalPaid,
                isFullyPaid: totalPaid >= order.total_price
            };

            res.json({
                success: true,
                order: {
                    ...order,
                    payments,
                    paymentStatus
                }
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Error retrieving order details',
                error: err.message
            });
        }
    }

    // Get paginated list of orders with filters
    async getOrderList(req, res) {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                startDate,
                endDate,
                minAmount,
                maxAmount,
                sort = '-createdAt'
            } = req.query;

            // Build filter
            const filter = { user: req.user.id };

            if (status) {
                filter.status = status;
            }

            if (startDate || endDate) {
                filter.createdAt = {};
                if (startDate) filter.createdAt.$gte = new Date(startDate);
                if (endDate) filter.createdAt.$lte = new Date(endDate);
            }

            if (minAmount || maxAmount) {
                filter.total_price = {};
                if (minAmount) filter.total_price.$gte = Number(minAmount);
                if (maxAmount) filter.total_price.$lte = Number(maxAmount);
            }

            // Get total count for pagination
            const total = await Order.countDocuments(filter);

            // Get orders
            const orders = await Order.find(filter)
                .populate({
                    path: 'items.product',
                    // select: 'name price description image'
                })
                .sort(sort)
                .skip((page - 1) * limit)
                .limit(Number(limit))
                .lean();

            // Get payments for all orders
            const orderIds = orders.map(order => order._id);
            const payments = await Payment.find({ order: { $in: orderIds } })
                .sort({ createdAt: -1 })
                .lean();

            // Combine orders with their payments and add payment status
            const ordersWithPayments = orders.map(order => {
                const orderPayments = payments.filter(payment => 
                    payment.order.toString() === order._id.toString()
                );
                
                const totalPaid = orderPayments.reduce((sum, payment) => sum + payment.amount, 0);
                
                return {
                    ...order,
                    payments: orderPayments,
                    paymentStatus: {
                        totalPaid,
                        remainingAmount: order.total_price - totalPaid,
                        isFullyPaid: totalPaid >= order.total_price
                    }
                };
            });

            // Calculate summary statistics
            const orderStats = {
                totalOrders: total,
                totalAmount: orders.reduce((sum, order) => sum + order.total_price, 0),
                averageOrderValue: orders.length > 0 
                    ? (orders.reduce((sum, order) => sum + order.total_price, 0) / orders.length).toFixed(2)
                    : 0
            };

            res.json({
                success: true,
                metadata: {
                    total,
                    page: Number(page),
                    pages: Math.ceil(total / limit)
                },
                stats: orderStats,
                orders: ordersWithPayments
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Error retrieving orders',
                error: err.message
            });
        }
    }

    // Update order status (optional method)
    async updateOrderStatus(req, res) {
        try {
            const { orderId } = req.params;
            const { status } = req.body;

            // Validate order ID
            if (!mongoose.Types.ObjectId.isValid(orderId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid order ID format'
                });
            }

            // Validate status
            const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status value'
                });
            }

            const order = await Order.findByIdAndUpdate(
                orderId,
                { 
                    status,
                    updated_at: Date.now()
                },
                { new: true }
            )
            .populate({
                path: 'items.product',
                select: 'name price description'
            });

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            res.json({
                success: true,
                message: 'Order status updated successfully',
                order
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Error updating order status',
                error: err.message
            });
        }
    }
}

module.exports = OrderController;