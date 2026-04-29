const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User'); // Your new blueprint!
const credentials = require('./credentials.json');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB; HUZZAH!'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

const { client_secret, client_id, redirect_uris } = credentials.web;
const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0] 
);

// THE FIX: We added 'email' and 'profile' scopes so we can save your info!
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

// --- ROUTES ---

// Route 1: Get Google Login URL
app.get('/api/auth/url', (req, res) => {
  console.log('\n=======================================');
  console.log('📍 STEP 1: Frontend just asked for the Google URL!');
  const accountType = req.query.type || 'primary'; 
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline', 
    prompt: 'consent',
    scope: SCOPES,
    state: accountType 
  });
  console.log('🔗 Generated URL successfully. Sending to frontend...');
  res.json({ url: authUrl });
});

// Route 2: Google Callback (Now with 100% more Database!)
app.get('/oauth2callback', async (req, res) => {
  console.log('\n=======================================');
  console.log('📍 STEP 2: Google just redirected the user back to us!');
  const code = req.query.code;
  const accountType = req.query.state || 'primary'; 

  if (!code) {
    console.log('❌ ERROR: Google did not send a code.');
    return res.status(400).send('No code provided');
  }

  try {
    console.log('⏳ STEP 3: Trading the secret code for VIP Tokens...');
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    console.log('✅ Got the tokens!');

    console.log('⏳ STEP 4: Asking Google for the user profile...');
    const oauth2 = google.oauth2({ auth: oAuth2Client, version: 'v2' });
    const userInfo = await oauth2.userinfo.get();
    console.log(`👤 Profile found! Hello, ${userInfo.data.email}`);
    
    console.log('⏳ STEP 5: Talking to MongoDB...');
    let user = await User.findOne({ googleId: userInfo.data.id });
    
    if (user) {
      user.tokens = tokens;
      await user.save();
      console.log(`♻️ SUCCESS: Updated existing user: ${user.email}`);
    } else {
      user = new User({
        googleId: userInfo.data.id,
        email: userInfo.data.email,
        name: userInfo.data.name,
        tokens: tokens
      });
      await user.save();
      console.log(`🎉 SUCCESS: Created brand new user: ${user.email}`);
    }

    console.log('🚀 STEP 6: Kicking the user back to the dashboard!');
    res.redirect(`http://localhost:3000?token=${encodeURIComponent(JSON.stringify(tokens))}&type=${accountType}`);
  } catch (error) {
    console.error('\n❌ FATAL ERROR IN CALLBACK:');
    console.error(error);
    res.status(500).send('Authentication failed');
  }
});

// Start the server
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});