const mongoose = require('mongoose');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { Schema } = mongoose;

const ratingSchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true }, // Reference to Product
    rating: { type: Number, required: true },
    comments: { type: String },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User
},{
    timestamps: true
  });
ratingSchema.plugin(aggregatePaginate);

module.exports = mongoose.model('Rating', ratingSchema);
