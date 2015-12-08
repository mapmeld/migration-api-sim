var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');

var questionSchema = mongoose.Schema({
  question: String,
  language: String,
  stage: String,
  tags: [String],
  created_at: Date,
  updated_at: Date
});
questionSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Question', questionSchema);
