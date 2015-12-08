var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');

var postSchema = mongoose.Schema({
  title: String,
  description: String,
  source: String,
  tags: [String],
  language: String,
  type: String,
  data: {
    content: String,
    media_url: String
  },
  question_ids: Array,
  created_at: Date,
  updated_at: Date
});
postSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Post', postSchema);
