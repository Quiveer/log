const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: String,
  password: String
});
const logins = mongoose.model('logins', UserSchema);

module.exports = logins;