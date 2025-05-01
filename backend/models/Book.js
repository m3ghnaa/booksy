const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  googleBookId: { type: String, required: true },
  title: { type: String, required: true },
  authors: [String],
  thumbnail: String,
  pageCount: Number,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: {
    type: String,
    enum: ['currentlyReading', 'wantToRead', 'finishedReading'],
    required: true
  }
});

const Book = mongoose.model('Book', BookSchema);
module.exports = Book;
