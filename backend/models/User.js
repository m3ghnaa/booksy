const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    // Not required as Google users may not have a password
    required: function() {
      return this.authType === 'local';
    }
  },
  avatar: {
    type: String,
  },
  googleId: {
    type: String
    // Remove the unique constraint entirely from the schema
  },
  authType: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  }
}, {
  timestamps: true,
  // This ensures virtual properties are included when converting to JSON
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password; // Don't include password in JSON
      return ret;
    }
  }
});

module.exports = mongoose.model('User', userSchema);