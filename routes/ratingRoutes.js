const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware'); // Ensure authentication
const RatingController = require('../controllers/ratingController');

// Create an instance of RoutingController
const ratingController = new RatingController();

// Route to create a new payment
router.post('/:productId', authMiddleware, ratingController.createRating.bind(ratingController));

router.put('/:productId', authMiddleware, ratingController.updateRating.bind(ratingController));

// Route to get rating details
router.get('/:productId', ratingController.getAllRatings.bind(ratingController));


module.exports = router;
