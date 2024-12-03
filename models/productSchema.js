const mongoose = require('mongoose');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { Schema } = mongoose;

const productSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  images: { type: Array,default:[] },
  price: { type: Number, required: true },
  stock_quantity: { type: Number, required: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category' }, // Referencing Category
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, default: new mongoose.Types.ObjectId("67495f30237be81271b741c0")   }, // Reference to User
},{
  timestamps: true
});
productSchema.plugin(aggregatePaginate);


module.exports = mongoose.model('Product', productSchema);
