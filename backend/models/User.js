const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Define the User Schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [false, 'Password is optional for OAuth users'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    googleId: {
      type: String
    },
    authType: {
      type: String,
      enum: ['local', 'google'],
      default: 'local'
    },
    lastReadingUpdate: {
      type: Date
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    favoriteGenre: {
      type: String,
      default: ''
    },
    readingGoal: {
      type: Number,
      default: 0
    },
    maxReadingStreak: {
      type: Number,
      default: 0
    },
    totalPagesRead: {
      type: Number,
      default: 0
    },
    avatar: { type: String, default: 'FaUserCircle' },
    readingLog: [
      {
        date: {
          type: Date,
          required: true
        },
        pagesRead: {
          type: Number,
          default: 0
        },
        bookId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Book'
        }
      }
    ]
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password;
        return ret;
      }
    }
  }
);

// Method to match entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);