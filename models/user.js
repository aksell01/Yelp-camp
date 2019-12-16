const mongoose = require("mongoose");
const passportLocalMOngoose = require("passport-local-mongoose");

const UserSchema = new mongoose.Schema({
      username: String,
      password: String,  
});

UserSchema.plugin(passportLocalMOngoose);

module.exports = mongoose.model("User", UserSchema);