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
    required: true,
  },
  pagesRead: {
    type: Number,
    default: 0,
  },
  progressType: {
    type: String,
    enum: ['percentage', 'pages'],
    default: 'percentage',
  },
  lastRead: {
    type: Date,
  },
});

BookSchema.virtual('progress').get(function () {
  if (this.pageCount && this.pageCount > 0) {
    return (this.pagesRead / this.pageCount) * 100;
  }
  return 0;
});

BookSchema.set('toJSON', { virtuals: true });

const Book = mongoose.model('Book', BookSchema);
module.exports = Book;