const express = require('express');
const app = express();
const errorMiddleware = require('./middleware/errorMiddleware');
const loggerMiddleware = require('./middleware/loggerMiddleware');
const cors = require('cors');

const connectDB = require('./config/db'); 
require('dotenv').config(); 

// Middleware for parsing JSON and URL-encoded data
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Enable CORS for all requests
app.use(cors());

// Middleware for logging requests
app.use(loggerMiddleware);
const authRoutes = require('./routes/authRoutes'); 
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const orderRoutes = require('./routes/orderRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const addressRoutes = require('./routes/addressRoutes');

// Connect to the database
connectDB();

// Use route modules
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/address', addressRoutes);

// Error handling middleware
app.use(errorMiddleware);


// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
