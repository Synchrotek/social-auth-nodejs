const express = require('express');
const session = require('express-session');
require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/auth.routes.js');
app.use(authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});