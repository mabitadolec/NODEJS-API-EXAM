const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = express();

//import routes
const authRoute = require('./routes/auth');
const imgRoute = require('./routes/images');

dotenv.config();

//connect to DB
mongoose.connect(process.env.DB_CONNECT, {useNewUrlParser: true }, () => {
    console.log('connected to DB!')
});


//Middleware
app.use(express.json());

//Route middlewares
 app.use('/api/user', authRoute);
 app.use('/api/images', imgRoute);

 
app.listen(3000, () => {
    console.log('Server up and running on PORT: 3000!')
})