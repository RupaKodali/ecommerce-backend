const User = require('../models/userSchema');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class AuthController {
    // Register a new user with validation
    async registerUser(req, res) {
        try {
            const { email, password, name } = req.body;

            // Input validation
            if (!email || !password || !name) {
                return res.status(400).json({
                    success: false,
                    message: 'All fields are required'
                });
            }

            // Email format validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email format'
                });
            }

            // Password strength validation
            if (password.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 8 characters long'
                });
            }

            // Check if user already exists
            const existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'Email already registered'
                });
            }

            // Create verification token
            // const verificationToken = crypto.randomBytes(32).toString('hex');
            // const verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

            // Create new user
            const user = new User({
                email: email.toLowerCase(),
                password,
                name,
                // verificationToken,
                // verificationExpires,
                lastLogin: null
            });

            await user.save();

            // Generate initial access token
            const accessToken = this.generateAccessToken(user._id);
            const refreshToken = this.generateRefreshToken(user._id);

            // Save refresh token hash
            user.refreshToken = crypto
                .createHash('sha256')
                .update(refreshToken)
                .digest('hex');
            await user.save();

            // Send verification email (implement your email service)
            // await this.sendVerificationEmail(email, verificationToken);

            res.status(201).json({
                success: true,
                message: 'Registration successful',
                data: {
                    userId: user._id,
                    name: user.name,
                    email: user.email,
                    accessToken,
                    refreshToken
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error registering user',
                error: error.message
            });
        }
    }

    // Login user with security features
    async loginUser(req, res) {
        try {
            const { email, password } = req.body;

            // Input validation
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            // Find user and handle failed attempts
            const user = await User.findOne({ email: email.toLowerCase() });
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Check if account is locked
            if (user.isLocked && user.lockUntil > Date.now()) {
                return res.status(423).json({
                    success: false,
                    message: `Account is locked. Try again in ${Math.ceil((user.lockUntil - Date.now()) / 1000 / 60)} minutes`
                });
            }

            // Check if account is verified
            if (!user.isVerified) {
                return res.status(403).json({
                    success: false,
                    message: 'Please verify your email address'
                });
            }

            // Verify password
            const isValidPassword = await user.comparePassword(password);
            if (!isValidPassword) {
                // Increment failed attempts
                user.failedAttempts = (user.failedAttempts || 0) + 1;

                // Lock account after 5 failed attempts
                if (user.failedAttempts >= 5) {
                    user.isLocked = true;
                    user.lockUntil = Date.now() + 15 * 60 * 1000; // 15 minutes
                    await user.save();

                    return res.status(423).json({
                        success: false,
                        message: 'Account locked due to too many failed attempts. Try again in 15 minutes'
                    });
                }

                await user.save();
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Reset failed attempts on successful login
            user.failedAttempts = 0;
            user.isLocked = false;
            user.lockUntil = null;
            user.lastLogin = Date.now();

            // Generate new tokens
            const accessToken = this.generateAccessToken(user._id);
            const refreshToken = this.generateRefreshToken(user._id);

            // Save refresh token hash
            user.refreshToken = crypto
                .createHash('sha256')
                .update(refreshToken)
                .digest('hex');
            await user.save();

            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    userId: user._id,
                    name: user.name,
                    email: user.email,
                    accessToken,
                    refreshToken
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error during login',
                error: error.message
            });
        }
    }

    // Refresh access token
    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Refresh token is required'
                });
            }

            // Verify refresh token
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

            // Find user by refresh token hash
            const refreshTokenHash = crypto
                .createHash('sha256')
                .update(refreshToken)
                .digest('hex');

            const user = await User.findOne({
                _id: decoded.id,
                refreshToken: refreshTokenHash
            });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid refresh token'
                });
            }

            // Generate new tokens
            const newAccessToken = this.generateAccessToken(user._id);
            const newRefreshToken = this.generateRefreshToken(user._id);

            // Update refresh token hash
            user.refreshToken = crypto
                .createHash('sha256')
                .update(newRefreshToken)
                .digest('hex');
            await user.save();

            res.json({
                success: true,
                data: {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken
                }
            });
        } catch (error) {
            res.status(401).json({
                success: false,
                message: 'Invalid refresh token',
                error: error.message
            });
        }
    }

    // // Verify email
    // async verifyEmail(req, res) {
    //     try {
    //         const { token } = req.params;

    //         const user = await User.findOne({
    //             verificationToken: token,
    //             verificationExpires: { $gt: Date.now() }
    //         });

    //         if (!user) {
    //             return res.status(400).json({
    //                 success: false,
    //                 message: 'Invalid or expired verification token'
    //             });
    //         }

    //         user.isVerified = true;
    //         user.verificationToken = undefined;
    //         user.verificationExpires = undefined;
    //         await user.save();

    //         res.json({
    //             success: true,
    //             message: 'Email verified successfully'
    //         });
    //     } catch (error) {
    //         res.status(500).json({
    //             success: false,
    //             message: 'Error verifying email',
    //             error: error.message
    //         });
    //     }
    // }

    // Logout user
    async logoutUser(req, res) {
        try {
            const userId = req.user.id;

            // Clear refresh token
            await User.findByIdAndUpdate(userId, {
                $unset: { refreshToken: 1 }
            });

            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error during logout',
                error: error.message
            });
        }
    }

    async verifytoken(req, res) {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ message: 'Access denied' });
    
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            if (!user) return res.status(401).json({ message: 'User not found' });
            res.status(200).json({ message: 'Valid token' });
        } catch (err) {
            res.status(401).json({ message: 'Invalid token' });
        }
    }

    // Helper method to generate access token
    generateAccessToken(userId) {
        return jwt.sign(
            { id: userId },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );
    }

    // Helper method to generate refresh token
    generateRefreshToken(userId) {
        return jwt.sign(
            { id: userId },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );
    }

    // Password reset request
    async requestPasswordReset(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required'
                });
            }

            const user = await User.findOne({ email: email.toLowerCase() });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenHash = crypto
                .createHash('sha256')
                .update(resetToken)
                .digest('hex');

            user.resetPasswordToken = resetTokenHash;
            user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
            await user.save();

            // Send password reset email (implement your email service)
            // await this.sendPasswordResetEmail(email, resetToken);

            res.json({
                success: true,
                message: 'Password reset instructions sent to email'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error requesting password reset',
                error: error.message
            });
        }
    }

    // Reset password
    async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;

            if (!token || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Token and new password are required'
                });
            }

            // Password strength validation
            if (newPassword.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 8 characters long'
                });
            }

            const resetTokenHash = crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');

            const user = await User.findOne({
                resetPasswordToken: resetTokenHash,
                resetPasswordExpires: { $gt: Date.now() }
            });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired reset token'
                });
            }

            user.password = newPassword;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();

            res.json({
                success: true,
                message: 'Password reset successful'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error resetting password',
                error: error.message
            });
        }
    }
}

module.exports = AuthController;