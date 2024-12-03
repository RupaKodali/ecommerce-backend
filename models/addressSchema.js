const mongoose = require('mongoose');
const { Schema } = mongoose;
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const addressSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User
  is_default:{type:Boolean},
  address_line_1:{type:String},
  city:{type:String},
  zipcode:{type:String},
  state:{type:String}
},{
  timestamps: true
});

addressSchema.plugin(aggregatePaginate);

module.exports = mongoose.model('Address', addressSchema);
