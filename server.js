require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const passport =require('passport');
const jwt =require('jsonwebtoken');
const nodemailer=require('nodemailer');
require('./passport-config');

const crypto = require('crypto');
const secretKey = crypto.randomBytes(32).toString('hex'); // Generates a 256-bit key


const app = express();
const port=https://animated-mandazi-ef27ca.netlify.app;
const User = require('./models/User');
const Recipe = require('./models/Recipe');

//middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const connection = mongoose.connection;
connection.once('open', () => {
  console.log('MongoDB database connection established successfully');
});

const transporter =nodemailer.createTransport({
  service:process.env.EMAIL_SERVICE_PROVIDER,
  auth:{
    user:process.env.EMAIL_USER,
    pass:process.env.GMAIL_APP_PASSWORD,
  }
});

//to search for the recipes
app.get('/recipes/search', (req, res) => {
  const searchQuery = req.query.q;

  Recipe.find({ title: { $regex: searchQuery, $options: 'i' } })
    .then(recipes => {
      res.json(recipes);
    })
    .catch(error => {
      console.error('Search error:', error);
      res.status(500).json({ error: 'An error occurred while searching for recipes.' });
    });
});

// Register a new user
app.post('/register', async (req, res) => {
  const { username, email, password, savedRecipes } = req.body;
  
  try {
    const newUser = new User({ username, email, password, savedRecipes });
    console.log(newUser)
    await newUser.save();

    // Generate a JWT token
    const token = jwt.sign({ userId: newUser._id }, secretKey, { expiresIn: '1h' });

    res.json({ message: 'User registered!', token }); // Return the token
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// User login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Compare hashed password
    if (user.password !== password) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1h' });

    const user_name =  user.username
    const user_id = user._id

    res.json({ message: 'Login successful', token , username : user_name , userid :  user_id }); // Return the token
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
//user profile(protected route)
app.get('/profile', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.json(req.user);
});


// Create a new recipe (it woeked fine in creating recipe)
app.post('/recipes/create', (req, res) => {
  const { title, ingredients, instructions,cookingtime,image, creator } = req.body;
  const newRecipe = new Recipe({ title, ingredients, instructions,cookingtime,image, creator, createdAt: new Date() });
  console.log(req.body)
  newRecipe.save()
    .then(() => res.json('Recipe created!'))
    .catch(err => res.status(400).json('Error: ' + err));
});


app.put('/recipes/:userId', async(req,res) =>{
   console.log(req.params.userId,req.body.recipeId)

   

   try {
    const userId = req.params.userId;
    const recipeId = req.body.recipeId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const savedRecipes = user.savedRecipes;

    const recipeIndex = savedRecipes.findIndex(recipe => recipe._id.toString() === recipeId);

    if (recipeIndex === -1) {
      return res.status(404).json({ message: 'Recipe not found in saved recipes' });
    }

    savedRecipes.splice(recipeIndex, 1);

    await user.save();

    return res.status(200).json({ message: 'Recipe removed from saved recipes' });
  } catch (error) {
    console.error('Remove recipe error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }



  // res.status(200).json({message : "success "})
} )



// Get saved recipes for a user
app.get('/recipes/:userId', async(req, res) => {
  const userId = req.params.userId;
  // console.log(userId)
  const user =  await User.findById(userId)
  // console.log(user)
 try{
  res.status(200).send(user.savedRecipes);
 }catch(error) {
  console.error('Retrive recipe error:', error);
  res.status(500).json({ error: 'An error occurred while saving the recipe' });
}
  
  // console.log(user)
  // Recipe.find({ creator: userId })
  //   .then(recipes => res.json(recipes))
  //   .catch(err => res.status(400).json('Error: ' + err));
});

//to save a recipe
app.post('/save', async (req, res) => {
  const recipeId = req.body.recipeId;
  const userId =  req.body.userid;
  console.log("hello")

  try {
    const recipe = await Recipe.findById(recipeId);
    const user = await User.findById(userId)
    console.log(user)
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    // Save the recipe to the user's saved recipes list
    
    // req.user.savedRecipes.push(recipe);
    // await req.user.save();

    user.savedRecipes.push(recipe);
    await user.save();

    res.status(200).json({ message: 'Recipe saved successfully' });
  } catch (error) {
    console.error('Save recipe error:', error);
    res.status(500).json({ error: 'An error occurred while saving the recipe' });
  }
});

// GET all recipes
app.get('/recipes', async (req, res) => {
  try {
    const recipes = await Recipe.find();
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recipes', error: error.message });
  }
});

// PUT /api/recipes/:id
app.put('/recipes/:id', async (req, res) => {
  const recipeId = req.params.id;

  try {
    const updatedRecipe = await Recipe.findByIdAndUpdate(
      recipeId,
      req.body,
      { new: true }
    );

    if (!updatedRecipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    res.json(updatedRecipe);
  } catch (error) {
    res.status(500).json({ message: 'Error updating recipe', error: error.message });
  }
});

//to delete the recipe 
app.delete('/recipes/:id/:userid', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    const userId =  req.params.userid;
  //  console.log("hello from delete",recipe)
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    
    // Check if the authenticated user is the creator of the recipe
    
    if (recipe.creator.toString() !== userId) {
      return res.status(403).json({ message: 'You are not authorized to delete this recipe' });
    }
    
    await recipe.deleteOne();
    return res.status(200).json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Fetch users created recipes
app.get('/recipes/user/:userId', async (req, res) => {
  try {
    const recipes = await Recipe.find();
    res.json(recipes);
  } catch (error) {
    console.error('Error fetching user recipes:', error);
    res.status(500).json({ error: 'An error occurred while fetching user recipes' });
  }
});

app.post('/send-verification-email', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const verificationToken = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1h' });
    user.verificationToken = verificationToken;
    await user.save();

    const emailContent = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Verification',
      text: `Click the following link to verify your password reset:  http://localhost:3000/reset-password/${verificationToken}`,
    };
   
    await transporter.sendMail(emailContent);

    res.json({ message: 'Verification email sent successfully' });
  } catch (error) {
    console.error('Send verification email error:', error);
    res.status(500).json({ error: 'An error occurred while sending the verification email'});
  }
});

// New route: Reset Password
app.post('/reset-password/:token', async (req, res) => {
  const { token} =req.params;
  const{newPassword} =req.body;
  try {
    const decodedToken = jwt.verify(token, secretKey);
    const user = await User.findOne({ _id: decodedToken.userId })
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = newPassword;
    user.verificationToken = null; 
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'An error occurred while processing the request' });
  }
});

// Add comments to a recipe
app.post('/:recipeId/comments', async (req, res) => {
  const { recipeId } = req.params;
  const { comment } = req.body;

  try {
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    recipe.comments.push(comment);
    await recipe.save();

    res.status(200).json({ message: 'Comment added successfully' });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
