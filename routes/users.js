const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/InstagramClone');

const userSchema = mongoose.Schema({
  username:String,
  name:String,
  email:String,
  password:String,
  pfpimage:{
    type:String,
    default:"Default_pfp.png"
  },
  posts: [{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Post',
  }],
  bio:{
    type:String,
    default:"Welcome to my Profile"
  },
  followers : [{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User'
  }],
  following : [{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User'
  }],
});

userSchema.plugin(plm);

module.exports = mongoose.model('User' , userSchema);
