const mongoose = require('mongoose');
const { Schema } = mongoose;
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");


const paymentSchema = new Schema({
  order: { type: Schema.Types.ObjectId, ref: 'Order' }, // Reference to Order
  payment_method: { type: String, required: true }, // e.g., 'credit_card', 'paypal'
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  amount: { type: Number, required: true },
  transaction_id: { type: String },
},{
  timestamps: true
});

paymentSchema.plugin(aggregatePaginate);

module.exports = mongoose.model('Payment', paymentSchema);
