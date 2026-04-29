const mongoose = require('mongoose');

// This is the blueprint for every user that signs up for DayCraft
const userSchema = new mongoose.Schema({
  googleId: { 
    type: String, 
    required: true, 
    unique: true // No duplicate accounts!
  },
  email: { 
    type: String, 
    required: true 
  },
  name: { 
    type: String 
  },
  tokens: { 
    type: Object, // This is where we securely lock away the VIP Google tokens
    required: true 
  }
}, { 
  timestamps: true // Automatically adds 'createdAt' and 'updatedAt' dates
});

module.exports = mongoose.model('User', userSchema);