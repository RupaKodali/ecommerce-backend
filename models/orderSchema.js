const mongoose = require('mongoose');
const { Schema } = mongoose;
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const orderItemSchema = require('./orderItemSchema'); // Import the embedded order item schema

const orderSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User
  items: [orderItemSchema], // Array of embedded order items
  total_price: { type: Number, required: true }, // Total price of the order
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  shipping_address: { type: Schema.Types.ObjectId, ref: 'Address' }, // Reference to Address
  notes: { type: String },
  estimated_delivery: { type: Date }
}, {
  timestamps: true
});

orderSchema.plugin(aggregatePaginate);

module.exports = mongoose.model('Order', orderSchema);
