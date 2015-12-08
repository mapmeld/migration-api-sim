var mongoose = require('mongoose');

var questionSchema = mongoose.Schema({
  question: String,
  language: String,
  stage: String,
  tags: [String],
  created_at: Date,
  updated_at: Date
});

module.exports = mongoose.model('Question', questionSchema);
