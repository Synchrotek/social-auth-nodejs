const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.get('/', (req, res) => {
    const userInfo = JSON.stringify(req.session.user);
    res.render('index', { user: userInfo });
});

router.get('/login', (req, res) => {
    res.render('login');
});

router.get('/auth/google', (req, res) => {
    const redirectUri = 'http://localhost:3000/auth/google/callback';
    const scope = 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}`;
    res.redirect(authUrl);
});

router.get('/auth/google/callback', async (req, res) => {
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

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;