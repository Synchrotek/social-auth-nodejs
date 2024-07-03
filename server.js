const express = require('express');
const axios = require('axios');
const session = require('express-session');
const jwt = require('jsonwebtoken');
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
app.get('/', (req, res) => {
    const userInfo = JSON.stringify(req.session.user);
    res.render('index', { user: userInfo });
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/auth/google', (req, res) => {
    const redirectUri = 'http://localhost:3000/auth/google/callback';
    const scope = 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}`;
    res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
    const code = req.query.code;
    const redirectUri = 'http://localhost:3000/auth/google/callback';

    try {
        const response = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
        });

        const { access_token } = response.data;

        const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const profile = userInfoResponse.data;

        // Create JWT token
        const token = jwt.sign(profile, process.env.SESSION_SECRET, { expiresIn: '1h' });

        // Store user information in session
        req.session.user = { profile, token };

        res.redirect('/');
    } catch (error) {
        console.error('Error during authentication', error);
        res.redirect('/login');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});