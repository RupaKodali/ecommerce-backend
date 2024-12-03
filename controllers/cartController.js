const Cart = require('../models/cartSchema');
const Product = require('../models/productSchema');
const mongoose = require('mongoose');

class CartController {
    // Get cart with product details and total calculations
    async getCart(req, res) {
        try {
            const userId = req.user.id;


            // Validate user ID
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID format'
                });
            }

            // Find or create cart
            let cart = await Cart.findOne({ user: userId })
                .populate({
                    path: 'items.product',
                    // select: 'name price description stock_quantity image'
                });

            if (!cart) {
                cart = new Cart({ user: userId, items: [] });
                await cart.save();
            }

            // Calculate totals and check stock availability
            const cartDetails = await this.calculateCartDetails(cart);

            res.json({
                success: true,
                cart: cartDetails
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Error retrieving cart',
                error: err.message
            });
        }
    }

    // Add item to cart with stock validation
    async addToCart(req, res) {
        try {
            const userId = req.user.id;
            const { productId, quantity } = req.body;

            // Validate IDs
            if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID or product ID format'
                });
            }

            // Validate quantity
            if (!quantity || quantity < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Quantity must be greater than 0'
                });
            }

            // Check product existence and stock
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            // Find or create cart
            let cart = await Cart.findOne({ user: userId });
            if (!cart) {
                cart = new Cart({ user: userId, items: [] });
            }

            // Find existing cart item
            const existingItem = cart.items.find(item =>
                item.product.toString() === productId
            );

            // Calculate new quantity
            const newQuantity = existingItem
                ? existingItem.quantity + quantity
                : quantity;

            // Validate stock availability
            if (newQuantity > product.stock_quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${product.stock_quantity} items available in stock`
                });
            }

            if (existingItem) {
                existingItem.quantity = newQuantity;
                existingItem.updated_at = Date.now();
            } else {
                cart.items.push({
                    product: productId,
                    quantity,
                    added_at: Date.now()
                });
            }

            await cart.save();

            // Get updated cart with details
            const updatedCart = await Cart.findById(cart._id)
                .populate({
                    path: 'items.product',
                    select: 'name price description stock_quantity image'
                });

            const cartDetails = await this.calculateCartDetails(updatedCart);

            res.status(201).json({
                success: true,
                message: 'Item added to cart successfully',
                cart: cartDetails
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: 'Error adding item to cart',
                error: err.message
            });
        }
    }

    // Update cart item with validation
    async updateCartItem(req, res) {
        try {
            const userId = req.user.id;
            const { item_id, quantity } = req.body;

            // Validate IDs
            if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(item_id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID or item ID format'
                });
            }

            // Validate quantity
            if (!quantity || quantity < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid quantity value'
                });
            }

            // Find cart
            const cart = await Cart.findOne({ user: userId });
            if (!cart) {
                return res.status(404).json({
                    success: false,
                    message: 'Cart not found'
                });
            }

            // Find cart item
            const cartItem = cart.items.id(item_id);
            if (!cartItem) {
                return res.status(404).json({
                    success: false,
                    message: 'Cart item not found'
                });
            }

            // Check stock availability
            const product = await Product.findById(cartItem.product);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            if (quantity > product.stock_quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${product.stock_quantity} items available in stock`
                });
            }

            // Update quantity or remove if quantity is 0
            if (quantity === 0) {
                cart.items.pull({ _id: item_id });
            } else {
                cartItem.quantity = quantity;
                cartItem.updated_at = Date.now();
            }

            await cart.save();

            // Get updated cart with details
            const updatedCart = await Cart.findById(cart._id)
                .populate({
                    path: 'items.product',
                    select: 'name price description stock_quantity image'
                });

            const cartDetails = await this.calculateCartDetails(updatedCart);

            res.json({
                success: true,
                message: quantity === 0 ? 'Item removed from cart' : 'Cart item updated successfully',
                cart: cartDetails
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: 'Error updating cart item',
                error: err.message
            });
        }
    }

    // Remove item from cart
    async removeFromCart(req, res) {
        try {
            const { itemId } = req.params;
            const userId = req.user.id;
            // Validate IDs
            if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(itemId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID or item ID format'
                });
            }

            // Find cart
            const cart = await Cart.findOne({ user: userId });
            if (!cart) {
                return res.status(404).json({
                    success: false,
                    message: 'Cart not found'
                });
            }

            // Remove item
            cart.items.pull({ _id: itemId });
            await cart.save();

            // Get updated cart with details
            const updatedCart = await Cart.findById(cart._id)
                .populate({
                    path: 'items.product',
                    select: 'name price description stock_quantity image'
                });

            const cartDetails = await this.calculateCartDetails(updatedCart);

            res.json({
                success: true,
                message: 'Item removed from cart successfully',
                cart: cartDetails
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: 'Error removing item from cart',
                error: err.message
            });
        }
    }

    // Helper method to calculate cart details
    async calculateCartDetails(cart) {
        let subtotal = 0;
        let totalItems = 0;
        const unavailableItems = [];

        const items = await Promise.all(cart.items.map(async item => {
            const product = item.product;

            // Check if product still exists and has sufficient stock
            const currentProduct = await Product.findById(product._id)
                .select('stock_quantity price');

            const itemSubtotal = product.price * item.quantity;
            subtotal += itemSubtotal;
            totalItems += item.quantity;

            // Check stock availability
            const isAvailable = currentProduct && currentProduct.stock_quantity >= item.quantity;
            if (!isAvailable) {
                unavailableItems.push({
                    productId: product._id,
                    name: product.name,
                    requestedQuantity: item.quantity,
                    availableQuantity: currentProduct ? currentProduct.stock_quantity : 0
                });
            }

            return {
                ...item.toObject(),
                subtotal: itemSubtotal,
                isAvailable
            };
        }));

        // Calculate tax and shipping (example rates)
        const taxRate = 0.1; // 10%
        const tax = subtotal * taxRate;
        const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100

        return {
            items: items.sort((a, b) => new Date(b.added_at) - new Date(a.added_at)),
            summary: {
                subtotal,
                tax,
                shipping,
                total: subtotal + tax + shipping,
                totalItems
            },
            unavailableItems: unavailableItems.length > 0 ? unavailableItems : null,
            lastUpdated: new Date()
        };
    }

    // Clear cart (optional method)
    async clearCart(req, res) {
        try {
            const userId = req.user.id;

            // Validate user ID
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID format'
                });
            }

            const cart = await Cart.findOne({ user: userId });
            if (!cart) {
                return res.status(404).json({
                    success: false,
                    message: 'Cart not found'
                });
            }

            cart.items = [];
            await cart.save();

            res.json({
                success: true,
                message: 'Cart cleared successfully',
                cart: {
                    items: [],
                    summary: {
                        subtotal: 0,
                        tax: 0,
                        shipping: 0,
                        total: 0,
                        totalItems: 0
                    },
                    lastUpdated: new Date()
                }
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Error clearing cart',
                error: err.message
            });
        }
    }
}

module.exports = CartController;