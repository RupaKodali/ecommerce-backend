const mongoose = require('mongoose');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { Schema } = mongoose;

const cartSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User
  items: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true }, // Reference to Product
    quantity: { type: Number, required: true },
    added_at: { type: Date, default: Date.now }
  }]
},{
  timestamps: true
});
cartSchema.plugin(aggregatePaginate);


module.exports = mongoose.model('Cart', cartSchema);
