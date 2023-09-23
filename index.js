const express = require('express');
const { connectDB } = require('./database');
const User = require('./usermodel');
const Post = require('./postmodel');
const Comment = require('./comment');
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyparser.json());

connectDB();

// Passport configuration
passport.use(
  new GoogleStrategy(
    {
      clientID: '522578773347-0n9hj8qpv2qig1mf7r5bb3tn5gu6n8ao.apps.googleusercontent.com', // Replace with your actual Google Client ID
      clientSecret: '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', // Replace with your actual Google Client Secret
      callbackURL: 'https://blog-frontend-b511.onrender.com/auth/google/callback', // Adjust the URL to match your setup
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if a user with this Google ID already exists in your system
        const user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user); // User already exists, return the user
        } else {
          // User does not exist, create a new user
          const newUser = new User({
            googleId: profile.id,
            displayName: profile.displayName,
            // Add other user data fields as needed
          });

          await newUser.save();

          return done(null, newUser); // Return the new user
        }
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

app.use(
  session({
    secret: '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',
    resave: true,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());




app.post('/users/register',async (req,res)=>{
  try{
    const {username,email,password}=req.body;
    // const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username,email, password,role : "USER" });
    await user.save();
    res.json(user)
  }catch{
    res.status(500).json({ error: 'Could not fetch user' });
  }
});
app.post('/api/login',async (req,res)=>{
  const{username,password}=req.body;
  console.log(username,password);
  const user = await User.findOne({username,password});
  // console.log(user);
  if(user){
    res.status(200).json(user);
  }else{
    res.status(401).json({error:'Invalid username or password'});
  }
});
app.post('/api/posts', async (req, res) => {
  try {
   
    const { title, description, author } = req.body;
    console.log(author);
   
    
    const newPost = new Post({ title, description, author }); 
    
   ;
    await newPost.save();
    const user = await User.findById(author);
    if (user) {
      user.posts.push(newPost.username);
      await user.save();
    }
   

    res.status(201).json({ message: 'Post saved successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to save post' });
  }
});
app.get('/api/posts', async (req, res) => {
  try {
    
   
    const userId = req.query.userId;
    console.log(userId);

    const posts = await Post.find({ author: userId });
    console.log(posts);

    res.status(200).json(posts);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch user posts' });
  }
});
app.post('/api/posts/:postId/like', async (req, res) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);


    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    
    post.likes += 1;
    await post.save();

    res.status(200).json({ message: 'Like updated successfully', likes: post.likes });
  } catch (error) {
    console.error('Error updating like:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
app.post('/api/posts/:postId/comments', async (req, res) => {
  const postId = req.params.postId;
  const { text, userId } = req.body;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    const comment = { text, user: userId };
    post.comments.push(comment);
    await post.save();

    res.status(201).json({ message: 'Comment added successfully', comment });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Define the Google OAuth routes
app.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
);

app.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/success', // Replace with your desired success route
    failureRedirect: '/failure', // Replace with your desired failure route
  })
);

// Ensure user is authenticated before allowing access to your protected routes
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/google');
  // Example protected route
app.get('/protected', ensureAuthenticated, (req, res) => {
  res.send('This is a protected route.');
});
}



  app.listen(PORT,() => console.log(`Server running on port ${PORT}`));