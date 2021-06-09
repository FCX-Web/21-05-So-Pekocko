//temps de connexion : 2h

const express = require('express'); //https://expressjs.com/fr/
const mongoose = require('mongoose'); //https://www.npmjs.com/package/mongoose
const path = require('path'); //https://nodejs.org/api/path.html
const rateLimit = require("express-rate-limit"); //https://www.npmjs.com/package/express-rate-limit
const helmet = require("helmet"); //https://www.npmjs.com/package/helmet
const nocache = require('nocache'); //https://www.npmjs.com/package/nocache
require('dotenv').config(); //https://www.npmjs.com/package/dotenv

const saucesRoutes = require('./routes/sauces');
const userRoutes = require('./routes/user');
const { db } = require('./models/Sauce');

const app = express();

//limitation nombre de requêtes par sessions
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, //15 minutes
    max: 100 //100 requêtes
});

//connexion MongoDB
mongoose.connect(process.env.mongoUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch(() => console.log('Connexion à MongoDB échouée !'));

//Cors
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/api/sauces', saucesRoutes);
app.use('/api/auth', userRoutes);
app.use(limiter);
app.use(helmet());
app.use(nocache());

module.exports = app;