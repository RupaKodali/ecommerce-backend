const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true }, // Reference to Product
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }, // Price at the time of purchase
  subtotal: { type: Number, required: true }

});

module.exports = orderItemSchema;
