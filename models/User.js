const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  savedRecipes: [], // Assuming 'Recipe' is the model name for recipes
  createdRecipes: [{ type: Schema.Types.ObjectId, ref: 'Recipe' }]
});

const User = mongoose.model('User', userSchema);

module.exports = User;
