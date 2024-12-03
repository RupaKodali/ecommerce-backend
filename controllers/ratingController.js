const Rating = require('../models/ratingSchema');
const Product = require('../models/productSchema');
const mongoose = require('mongoose');

class RatingController {
    // Create or update a rating
    async createRating(req, res) {
        try {
            const { productId } = req.params;
            const userId = req.user.id;
            const { rating, comments } = req.body;

            // Validate product ID
            if (!mongoose.Types.ObjectId.isValid(productId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid product ID format'
                });
            }

            // Validate rating value
            if (!rating || rating < 1 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Rating must be between 1 and 5'
                });
            }

            // Check if product exists
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            // Check if user has already rated
            const existingRating = await Rating.findOne({
                product: productId,
                user: userId
            });

            if (existingRating) {
                return res.status(400).json({
                    success: false,
                    message: 'You have already rated this product. Please use update rating endpoint.'
                });
            }

            const newRating = new Rating({
                product: productId,
                user: userId,
                rating,
                comments: comments || ''
            });

            await newRating.save();

            // Calculate new average rating
            const avgRating = await Rating.aggregate([
                { $match: { product: new mongoose.Types.ObjectId(productId) } },
                {
                    $group: {
                        _id: null,
                        averageRating: { $avg: '$rating' },
                        totalRatings: { $sum: 1 }
                    }
                }
            ]);

            res.status(201).json({
                success: true,
                message: 'Rating created successfully',
                rating: newRating,
                productStats: {
                    averageRating: avgRating[0]?.averageRating.toFixed(1) || 0,
                    totalRatings: avgRating[0]?.totalRatings || 0
                }
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Error creating rating',
                error: err.message
            });
        }
    }

    // Update an existing rating
    async updateRating(req, res) {
        try {
            const { productId } = req.params;
            const userId = req.user.id;
            const { rating, comments } = req.body;

            // Validate product ID
            if (!mongoose.Types.ObjectId.isValid(productId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid product ID format'
                });
            }

            // Validate rating if provided
            if (rating && (rating < 1 || rating > 5)) {
                return res.status(400).json({
                    success: false,
                    message: 'Rating must be between 1 and 5'
                });
            }

            const existingRating = await Rating.findOne({
                product: productId,
                user: userId
            });

            if (!existingRating) {
                return res.status(404).json({
                    success: false,
                    message: 'Rating not found. Please create a new rating first.'
                });
            }

            // Update only provided fields
            if (rating) existingRating.rating = rating;
            if (comments !== undefined) existingRating.comments = comments;
            existingRating.updated_at = Date.now();

            await existingRating.save();

            // Calculate updated average rating
            const avgRating = await Rating.aggregate([
                { $match: { product: new mongoose.Types.ObjectId(productId) } },
                {
                    $group: {
                        _id: null,
                        averageRating: { $avg: '$rating' },
                        totalRatings: { $sum: 1 }
                    }
                }
            ]);

            res.json({
                success: true,
                message: 'Rating updated successfully',
                rating: existingRating,
                productStats: {
                    averageRating: avgRating[0]?.averageRating.toFixed(1) || 0,
                    totalRatings: avgRating[0]?.totalRatings || 0
                }
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Error updating rating',
                error: err.message
            });
        }
    }

    // Get all ratings for a product with pagination and sorting
    async getAllRatings(req, res) {
        try {
            const { productId } = req.params;
            const {
                page = 1,
                limit = 10,
                sort = '-createdAt',
                rating
            } = req.query;

            // Validate product ID
            if (!mongoose.Types.ObjectId.isValid(productId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid product ID format'
                });
            }

            // Build filter
            const filter = { product: productId };
            if (rating) {
                filter.rating = Number(rating);
            }

            // Get paginated ratings
            const ratings = await Rating.find(filter)
                .sort(sort)
                .skip((page - 1) * limit)
                .limit(Number(limit))
                .populate('user', 'name avatar') // Assuming user model has these fields
                .lean();

            const totalRatings = await Rating.countDocuments(filter);

            res.json({
                success: true,
                metadata: {
                    total: totalRatings,
                    page: Number(page),
                    pages: Math.ceil(totalRatings / limit)
                },
                ratings
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Error retrieving ratings',
                error: err.message
            });
        }
    }

}

module.exports = RatingController;