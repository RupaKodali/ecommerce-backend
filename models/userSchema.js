const mongoose = require('mongoose');
const { Schema } = mongoose;
const bcrypt = require('bcryptjs');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");


const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  refreshToken: { type: String },
  isLocked: { type: Boolean, default: false },
  failedAttempts: { type: Number },
  lockUntil: { type: Date },
  lastLogin: { type: Date },
  verificationToken: { type: String },
  verificationExpires: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  isVerified: { type: Boolean, default: true },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
},{
  timestamps: true
});

// Hash the password before saving the user
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.plugin(aggregatePaginate);

module.exports = mongoose.model('User', userSchema);
