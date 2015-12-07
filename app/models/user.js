//Get an instance of mongoo and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Setup model and pass it using model.exports
module.exports = mongoose.model('User', new Schema({
  name: String,
  password: String,
  admin: Boolean
}));
