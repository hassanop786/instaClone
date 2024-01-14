var express = require('express');
const passport = require('passport');
var router = express.Router();

const userModel = require('./users');
const postModel = require('./posts')
const localStrategy = require('passport-local');
const upload = require('./multer')

passport.use(new localStrategy(userModel.authenticate()));


router.get('/', function(req, res) {
  res.render('index', {footer: false});
});

router.get('/login', function(req, res) {
  res.render('login', {footer: false});
});

router.get('/feed', isLoggedIn , async function(req, res) {
  const posts = await postModel.find().populate('user').populate('user');
  const user = await userModel.findOne({username:req.session.passport.user}).populate('posts');
  const users = await userModel.find();
  res.render('feed', {footer: true , posts , user , users});
});

router.get('/user/post/:postid' , isLoggedIn , async function(req, res) {
  const post = await postModel.findOne({_id:req.params.postid}).populate('user');
  const user = await userModel.findOne({username:req.session.passport.user});

  res.render('showpost', {footer: true , post , user});
});

router.get('/profile', isLoggedIn ,  async function(req, res) {
  const user = await userModel.findOne({username:req.session.passport.user}).populate('posts');
  res.render('profile', {footer: true , user});
});

router.get('/search', isLoggedIn ,  async function(req, res) {
  const user = await userModel.findOne({username:req.session.passport.user}).populate('posts');
  res.render('search', {footer: true , user});
});

router.get('/edit', isLoggedIn ,  async function(req, res) {
  const user = await userModel.findOne({username:req.session.passport.user});
  res.render('edit', {footer: true , user});
});

router.get('/upload', isLoggedIn ,async  function(req, res) {
  const user = await userModel.findOne({username:req.session.passport.user}).populate('posts');
  res.render('upload', {footer: true , user});
});
router.get('/test' ,  function(req, res) {
  res.render('test');
});
router.get('/username/:username' , async  function(req, res) {
  const regex = new RegExp(`^${req.params.username}`, 'i');
  const users = await userModel.find({username:regex});
  res.json(users);
});

router.get('/post/like/:postid' ,isLoggedIn,async function(req,res,next){
  const user = await userModel.findOne({username:req.session.passport.user});
  const post = await postModel.findOne({_id:req.params.postid});

  if(post.likes.indexOf(user._id) == -1){
    post.likes.push(user._id);
  }
  else {
    post.likes.splice(post.likes.indexOf(user._id) , 1)
  }
  post.save();
  res.redirect('/feed');
})
router.get('/showpost/post/like/:postid' ,isLoggedIn,async function(req,res,next){
  const user = await userModel.findOne({username:req.session.passport.user});
  const post = await postModel.findOne({_id:req.params.postid});

  if(post.likes.indexOf(user._id) == -1){
    post.likes.push(user._id);
  }
  else {
    post.likes.splice(post.likes.indexOf(user._id) , 1)
  }
  post.save();
  res.redirect(`/user/post/${req.params.postid}`);
});


router.get('/user/profile/:userid' ,isLoggedIn,async function(req,res,next){
  const user = await userModel.findOne({_id:req.params.userid}).populate('posts');
  const followUser = await userModel.findOne({username:req.session.passport.user});

  if(user.username == followUser.username){
    res.redirect('/profile');
  }
  else{
    res.render('showprofile' , {user , followUser , footer:true});
  }
});


router.get('/user/profile/follow/:userid' ,isLoggedIn,async function(req,res,next){
  const user = await userModel.findOne({_id:req.params.userid});
  const followUser = await userModel.findOne({username:req.session.passport.user});

  if(user.followers.indexOf(followUser._id) == -1){
    user.followers.push(followUser._id);
    followUser.following.push(user._id);
  }
  else {
    user.followers.splice(user.followers.indexOf(followUser._id) , 1)
    followUser.following.splice(followUser.following.indexOf(user._id) , 1)
  }
  await user.save();
  await followUser.save();

  res.redirect(`/user/profile/${req.params.userid}`)
})
router.get('/user/follower/:userid' ,isLoggedIn,async function(req,res,next){
  const followerUser = await userModel.findOne({_id:req.params.userid}).populate('followers');
  const user = await userModel.findOne({username:req.session.passport.user});

  res.render('followers' , {footer:true , user , followerUser});

})
router.get('/user/following/:userid' ,isLoggedIn,async function(req,res,next){
  const followerUser = await userModel.findOne({_id:req.params.userid}).populate('following');
  const user = await userModel.findOne({username:req.session.passport.user});

  res.render('following' , {footer:true , user , followerUser});

})


// router.get('/user/profile/follow/:userid', isLoggedIn, async function(req, res, next) {
//   try {
//     const user = await userModel.findOne({ _id: req.params.userid }).populate('followers').exec();
//     const followUser = await userModel.findOne({ username: req.session.passport.user }).populate('following').exec();

//     if (user.followers.indexOf(followUser._id) === -1) {
//       user.followers.push(followUser._id);
//       followUser.following.push(user._id);
//     } else {
//       user.followers.splice(user.followers.indexOf(followUser._id), 1);
//       followUser.following.splice(followUser.following.indexOf(user._id), 1);
//     }

//     await user.save();
//     await followUser.save();

//     res.redirect(`/user/profile/${req.params.userid}`);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Internal Server Error');
//   }
// });


router.post('/register' , function(req,res){
  const {username,name,email} = req.body
  const userData = new userModel({
  username,
  name,
  email,
  });

  userModel.register(userData , req.body.password).then(function(){
    passport.authenticate('local')(req,res, function(){
      res.redirect('/profile')
    })
  })
});
router.post('/profile/update'  , upload.single('dp'), async function(req,res){

  if(!req.file){
    return res.status(400).send('No File Were Uploaded')
  }
  const user = await userModel.findOne({username:req.session.passport.user});
  const {username,name,bio} = req.body
  user.username = username ;
  user.name =name ;
  user.bio = bio ;
  user.pfpimage = req.file.filename;
  await user.save();
  res.redirect('/profile')

});

router.post('/uploadpost' ,upload.single('postimage') ,async function(req,res,next){
  if(!req.file){
    return res.status(400).send('No File Were Uploaded')
  }
  const user = await userModel.findOne({username:req.session.passport.user});
  const post = await postModel.create({
    caption:req.body.caption,
    postimage:req.file.filename,
    user:user._id,
  });
  user.posts.push(post);
  await user.save();

  res.redirect('/profile');
})



function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/login')
}


router.post('/login' , passport.authenticate('local' , {
  successRedirect:'/profile' ,
  failureRedirect:'/login'
}), function(req,res){})


router.get('/logout' , function(req,res,next){
  req.logout(function(err){
    if(err){
      return next(err);
    }
    res.redirect('/');
  })
});


module.exports = router;
