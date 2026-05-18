const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  title: String,
  content: String,
  image: String
});

module.exports = mongoose.model("Post", PostSchema);