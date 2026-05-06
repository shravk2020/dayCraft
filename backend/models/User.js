const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: { type: String },
  tokens: { type: Object, required: true },
  
  connectedCalendars: [{
    accountId: String,
    email: String,
    accountType: String, 
    tokens: Object
  }]
  
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);