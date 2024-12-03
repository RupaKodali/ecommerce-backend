# Ecommerce Backend

## Overview
A robust backend for an ecommerce platform focused on the buyer side functionality. The project provides endpoints for user authentication, product management, shopping cart operations, order processing, and payment handling.

## Technologies Used
- Node.js
- Express.js
- MongoDB (based on the Schema files)
- JSON Web Tokens (JWT) for authentication
- Middleware for logging and error handling

## Technical Dependencies
- bcryptjs
- cors
- dotenv
- express
- jsonwebtoken
- mongoose
- mongoose-aggregate-paginate-v2
- nodemon

## Features
- User Authentication & Authorization
- Product Management
- Shopping Cart Operations
- Order Processing
- Payment Integration
- Category Management
- Rating & Review System
- Address Management

## Project Structure
```
ecommerce-backend/
├── config/
│   └── seeders/
│       ├── categories.json
│       ├── seed.js
│       ├── databaseSeeder.js
│       └── db.js
├── controllers/
│   ├── addressController.js
│   ├── authController.js
│   ├── cartController.js
│   ├── categoryController.js
│   ├── orderController.js
│   ├── paymentController.js
│   ├── productController.js
│   ├── ratingController.js
│   └── userController.js
├── middleware/
│   ├── authMiddleware.js
│   ├── errorMiddleware.js
│   └── loggerMiddleware.js
├── models/
│   ├── addressSchema.js
│   ├── cartSchema.js
│   ├── categorySchema.js
│   ├── orderItemSchema.js
│   ├── paymentSchema.js
│   ├── productSchema.js
│   ├── ratingSchema.js
│   └── userSchema.js
├── utils/
│   ├── map.js
│   └── status.js
├── routes/
├── .env
├── app.js
└── package-lock.json
```

## Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn package manager

## Setup Instructions

### Installation
1. Clone the repository
```bash
git clone [your-repository-url]
cd ecommerce-backend
```

2. Install dependencies
```bash
npm install
```

3. Environment Setup
Create a `.env` file in the root directory with the following variables:
```
PORT=3000
MONGODB_URI=mongo_uri
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=yout_jwt_refresh_secret
```

### Database Seeding
To populate the database with initial data:
```bash
npm run seed
```

## API Endpoints and Documentation

### Authentication
- **Register User**
  - POST `/api/auth/register`
  ```json
  {
    "email": "user@example.com",
    "password": "Password123",
    "name": "User Name"
  }
  ```

- **Login**
  - POST `/api/auth/login`
  ```json
  {
    "email": "user@example.com",
    "password": "Password123"
  }
  ```

- **Logout**
  - POST `/api/auth/logout`
  - Requires Bearer Token

- **Verify Email**
  - GET `/api/auth/verify-email/:token`

- **Refresh Token**
  - POST `/api/auth/refresh-token`
  ```json
  {
    "refreshToken": "token"
  }
  ```

- **Password Reset Request**
  - POST `/api/auth/password-reset-request`
  ```json
  {
    "email": "user@example.com"
  }
  ```

- **Reset Password**
  - POST `/api/auth/password-reset`
  ```json
  {
    "token": "reset-token",
    "newPassword": "NewPassword123"
  }
  ```

### Products
- **Get All Products**
  - GET `/api/products`
  - Query Parameters:
    - page (default: 1)
    - limit (default: 10)
    - sort (field name)
    - minPrice
    - maxPrice
    - category
    - search

- **Get Random Products**
  - GET `/api/products/random`
  - Query Parameters:
    - limit

- **Get Product by ID**
  - GET `/api/products/:id`

- **Create Product**
  - POST `/api/products`
  ```json
  {
    "name": "Product Name",
    "description": "Product Description",
    "price": 99.99,
    "stock_quantity": 100,
    "category_id": "category_id"
  }
  ```

### Cart
- **Get Cart**
  - GET `/api/cart`

- **Add to Cart**
  - POST `/api/cart/add-item`
  ```json
  {
    "productId": "product_id",
    "quantity": 1
  }
  ```

- **Update Cart Item**
  - PUT `/api/cart/update-item`
  ```json
  {
    "item_id": "item_id",
    "quantity": 2
  }
  ```

- **Remove Cart Item**
  - DELETE `/api/cart/remove-item/:itemId`

- **Clear Cart**
  - DELETE `/api/cart`

### Orders
- **Create Order**
  - POST `/api/orders`
  ```json
  {
    "shipping_address": "address_id"
  }
  ```

- **Update Order**
  - PUT `/api/orders/:orderId`
  ```json
  {
    "status": "processing"
  }
  ```

- **Get Order by ID**
  - GET `/api/orders/:orderId`

- **Get Order Status**
  - GET `/api/orders/:orderId/status`

- **Get All User Orders**
  - GET `/api/orders`

### Payments
- **Create Payment**
  - POST `/api/payments`
  ```json
  {
    "orderId": "order_id",
    "paymentMethod": "paypal",
    "amount": 99.99,
    "transactionId": "transaction_id"
  }
  ```

- **Get All Payments**
  - GET `/api/payments`

- **Get Payment by ID**
  - GET `/api/payments/:paymentId`

### Ratings
- **Create Rating**
  - POST `/api/ratings/:productId`
  ```json
  {
    "rating": 5,
    "comments": "Great product!"
  }
  ```

- **Update Rating**
  - PUT `/api/ratings/:productId`
  ```json
  {
    "rating": 4,
    "comments": "Updated review"
  }
  ```

- **Get Product Ratings**
  - GET `/api/ratings/:productId`

### Address
- **Create Address**
  - POST `/api/address`
  ```json
  {
    "is_default": true,
    "address_line_1": "123 Street",
    "city": "City",
    "state": "State",
    "zipcode": "12345"
  }
  ```

- **Get User Addresses**
  - GET `/api/address`

- **Delete Address**
  - DELETE `/api/address/:addressId`

- **Set Default Address**
  - PATCH `/api/address/:addressId/set-default`
  
## Error Handling
The project uses a centralized error handling middleware that processes all errors and returns appropriate HTTP status codes and error messages.

## Security Features
- JWT-based authentication
- Password hashing
- Protected routes using authMiddleware
- Request logging
- Error tracking

## Contributing
1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request with a description of your changes

## Running Tests
```bash
npm test
```

## Development
To start the development server with nodemon:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`