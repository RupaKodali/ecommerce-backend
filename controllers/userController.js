const User = require('../models/userSchema'); // Import User model

class UserController {
    // Get a single user by ID
    async getUserById(req, res) {
        try {
            const user = await User.findById(req.user.id);
            if (!user) return res.status(404).json({ message: 'User not found' });
            res.json(user);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    // Create a new user
    async createUser(req, res) {
        const { email, password, name, role } = req.body;
        try {
            const newUser = new User({ email, password, name, role });
            await newUser.save();
            res.status(201).json(newUser);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    // Update user details
    async updateUser(req, res) {
        const { name, email } = req.body;
        try {
            const user = await User.findByIdAndUpdate(
                req.params.id,
                { name, email },
                { new: true, runValidators: true }
            );
            if (!user) return res.status(404).json({ message: 'User not found' });
            res.json(user);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    // Delete a user
    async deleteUser(req, res) {
        try {
            const user = await User.findByIdAndDelete(req.params.id);
            if (!user) return res.status(404).json({ message: 'User not found' });
            res.json({ message: 'User deleted' });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
}

module.exports = UserController;
