const Category = require('../models/categorySchema'); // Import Category model

class CategoryController {
    // Get all categories
    async getCategories(req, res) {
        try {
            const categories = await Category.find();
            res.json(categories);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    // Get a single category by ID
    async getCategoryById(req, res) {
        try {
            const category = await Category.findById(req.params.id);
            if (!category) return res.status(404).json({ message: 'Category not found' });
            res.json(category);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    // Create a new category
    async createCategory(req, res) {
        const { name } = req.body;
        try {
            const newCategory = new Category({ name });
            await newCategory.save();
            res.status(201).json(newCategory);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    // Update a category
    async updateCategory(req, res) {
        const { name } = req.body;
        try {
            const category = await Category.findByIdAndUpdate(
                req.params.id,
                { name },
                { new: true, runValidators: true }
            );
            if (!category) return res.status(404).json({ message: 'Category not found' });
            res.json(category);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

  // Delete a category
async deleteCategory(req, res) {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.json({ message: 'Category deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
}

module.exports = CategoryController;
