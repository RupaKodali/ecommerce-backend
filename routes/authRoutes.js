const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware'); // Ensure authentication
const AuthController = require('../controllers/authController');

const authController = new AuthController();

router.post('/register', authController.registerUser.bind(authController));
router.post('/login', authController.loginUser.bind(authController));
router.post('/logout', authMiddleware, authController.logoutUser.bind(authController));
router.get('/verify-token', authController.verifytoken.bind(authController));

router.post('/refresh-token', authController.refreshToken?.bind(authController));
// router.get('/verify-email/:token', authController.verifyEmail?.bind(authController));
router.post('/password-reset-request', authController.requestPasswordReset?.bind(authController));
router.post('/password-reset', authController.resetPassword?.bind(authController));

module.exports = router;