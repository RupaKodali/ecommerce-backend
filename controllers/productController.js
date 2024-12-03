const Product = require('../models/productSchema');
const Category = require('../models/categorySchema');
const Rating = require('../models/ratingSchema');
const mongoose = require('mongoose');

class ProductController {
    // Get all products with pagination, filtering, and sorting
    async getProducts(req, res) {
        try {
            const {
                page = 1,
                limit = 10,
                sort = 'name',
                category,
                minPrice,
                maxPrice,
                user_id,
                search
            } = req.query;

            let sortcond = {}; 

            if (sort.startsWith("-")) {
                sortcond = { [sort.slice(1)]: -1 };  
            } else {
                sortcond = { [sort]: 1 };  
            }
            // Build filter object
            const filter = {};
            if (category) {
                filter.category = new mongoose.Types.ObjectId(category);
            }
            if (minPrice || maxPrice) {
                filter.price = {};
                if (minPrice) filter.price.$gte = Number(minPrice);
                if (maxPrice) filter.price.$lte = Number(maxPrice);
            }
            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }
            if (user_id) {
                filter.user = new mongoose.Types.ObjectId(user_id);
            }
            const pipeline = [
                { $match: filter },
                {
                    $lookup: {
                        from: 'ratings',
                        localField: '_id',
                        foreignField: 'product',
                        as: 'ratings'
                    }
                },
                {
                    $addFields: {
                        avgRating: {
                            $cond: {
                                if: { $gt: [{ $size: "$ratings" }, 0] },
                                then: { $round: [{ $avg: "$ratings.rating" }, 1] },
                                else: 0
                            }
                        },
                        totalRatings: { $size: "$ratings" }
                    }
                },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'category',
                        foreignField: '_id',
                        as: 'category'
                    }
                },
                { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
                { $sort: sortcond },
                {
                    $facet: {
                        metadata: [
                            { $count: "total" },
                            {
                                $addFields: {
                                    page: Number(page),
                                    pages: {
                                        $ceil: { $divide: ["$total", Number(limit)] }
                                    }
                                }
                            }
                        ],
                        data: [
                            { $skip: (Number(page) - 1) * Number(limit) },
                            { $limit: Number(limit) }
                        ]
                    }
                }
            ];

            const result = await Product.aggregate(pipeline);

            if (!result[0].data.length) {
                return res.status(200).json({
                    success: false,
                    message: 'No products found'
                });
            }

            res.json({
                success: true,
                metadata: result[0].metadata[0],
                products: result[0].data
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Error retrieving products',
                error: err.message
            });
        }
    }
// Get completely random products
async getRandomProducts(req, res) {
    try {
        const { limit = 4 } = req.query;

        const pipeline = [
            { $sample: { size: Number(limit) } },
            {
                $lookup: {
                    from: 'ratings',
                    localField: '_id',
                    foreignField: 'product',
                    as: 'ratings'
                }
            },
            {
                $addFields: {
                    avgRating: {
                        $cond: {
                            if: { $gt: [{ $size: "$ratings" }, 0] },
                            then: { $round: [{ $avg: "$ratings.rating" }, 1] },
                            else: 0
                        }
                    },
                    totalRatings: { $size: "$ratings" }
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } }
        ];

        const products = await Product.aggregate(pipeline);

        if (!products.length) {
            return res.status(200).json({
                success: false,
                message: 'No products found'
            });
        }

        res.json({
            success: true,
            products
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving random products',
            error: err.message
        });
    }
}
    // Get a single product by ID with error handling
    async getProductById(req, res) {
        try {
            const { id } = req.params;

            // Validate ObjectId
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid product ID format'
                });
            }

            const pipeline = [
                { $match: { _id: new mongoose.Types.ObjectId(id) } },
                {
                    $lookup: {
                        from: 'ratings',
                        localField: '_id',
                        foreignField: 'product',
                        as: 'ratings'
                    }
                },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'category',
                        foreignField: '_id',
                        as: 'category'
                    }
                },
                { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
                {
                    $addFields: {
                        avgRating: {
                            $cond: {
                                if: { $gt: [{ $size: "$ratings" }, 0] },
                                then: { $round: [{ $avg: "$ratings.rating" }, 1] },
                                else: 0
                            }
                        },
                        totalRatings: { $size: "$ratings" }
                    }
                }
            ];

            const products = await Product.aggregate(pipeline);

            if (!products.length) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            res.json({
                success: true,
                product: products[0]
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Error retrieving product',
                error: err.message
            });
        }
    }

    // Create a new product with validation
    async createProduct(req, res) {
        try {
            const { name, description, price, stock_quantity, category_id } = req.body;
            const userId = req.user.id;

            // Validate user ID
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID format'
                });
            }
            // Validate required fields
            if (!name || !price || !category_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Name, price, and category are required'
                });
            }

            // Validate category exists
            if (!mongoose.Types.ObjectId.isValid(category_id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category ID format'
                });
            }

            const category = await Category.findById(category_id);
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            const newProduct = new Product({
                name,
                description,
                price,
                stock_quantity,
                category: category_id,
                user: userId
            });

            await newProduct.save();

            res.status(201).json({
                success: true,
                message: 'Product created successfully',
                product: newProduct
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: 'Error creating product',
                error: err.message
            });
        }
    }

    // Update a product with validation
    async updateProduct(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            // Validate ObjectId
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid product ID format'
                });
            }

            // Validate category if it's being updated
            if (updates.category_id) {
                if (!mongoose.Types.ObjectId.isValid(updates.category_id)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid category ID format'
                    });
                }

                const category = await Category.findById(updates.category_id);
                if (!category) {
                    return res.status(404).json({
                        success: false,
                        message: 'Category not found'
                    });
                }
                updates.category = updates.category_id;
                delete updates.category_id;
            }

            const product = await Product.findByIdAndUpdate(
                id,
                updates,
                { new: true, runValidators: true }
            ).populate('category');

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            res.json({
                success: true,
                message: 'Product updated successfully',
                product
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: 'Error updating product',
                error: err.message
            });
        }
    }

    // Delete a product with cleanup
    async deleteProduct(req, res) {
        try {
            const { id } = req.params;

            // Validate ObjectId
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid product ID format'
                });
            }

            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                // Delete product
                const product = await Product.findByIdAndDelete(id).session(session);
                if (!product) {
                    await session.abortTransaction();
                    return res.status(404).json({
                        success: false,
                        message: 'Product not found'
                    });
                }

                // Delete associated ratings
                await Rating.deleteMany({ product: id }).session(session);

                await session.commitTransaction();
                res.json({
                    success: true,
                    message: 'Product and associated data deleted successfully'
                });
            } catch (err) {
                await session.abortTransaction();
                throw err;
            } finally {
                session.endSession();
            }
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Error deleting product',
                error: err.message
            });
        }
    }
}

module.exports = ProductController;