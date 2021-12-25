const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  mobile1: String,
  guardian: String,
  mobile2: String,
  code: String,
  filename: String,
});
const user = mongoose.model('user', UserSchema);

module.exports = user;