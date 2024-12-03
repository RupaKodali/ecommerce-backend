const mongoose = require('mongoose');
const { Schema } = mongoose;
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");


const categorySchema = new Schema({
  name: { type: String, required: true },
},{
  timestamps:true
});
categorySchema.plugin(aggregatePaginate);

module.exports = mongoose.model('Category', categorySchema);
