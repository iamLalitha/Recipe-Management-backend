# Recipe-Management-backend
Live Url: https://animated-mandazi-ef27ca.netlify.app/

steps to login:
demo credentials:
email:guest1@gmail.com
password:guest1

API details:
1. To search for the recipes -get('/recipes/search')
2. To register new user -post('/register')
3. To login - post('/login')
4. To access Profile -get('/profile')
5. To create a new recipe - post('/recipes/create')
6. To get saved recipes for a user -get('/recipes/:userId')
7. To save a recipe -get('/save')
8. To get all recipes -get('/recipes')
9. To delete the recipe -delete('/recipes/:id/:userid')
10. To fetch users created recipes -get('/recipes/user/:userId')
11. To to send verification email -post('/send-verification-email')
12. To  Reset password -post('/reset-password/:token')
13. To comment on a recipe -post('/:recipeId/comments')
    
