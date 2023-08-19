const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const recipeSchema = new Schema({
  title: { type: String, required: true },
  ingredients: { type: String, required: true },
  instructions: { type: String, required: true },
  cookingtime: { type: Number, required: true },
  image: { type: String }, // URL to the recipe image
  creator: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date }
});

const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = Recipe;
