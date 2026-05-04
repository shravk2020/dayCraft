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
  .then(() => console.log('Connected to MongoDB; HUZZAH!'))
  .catch((err) => console.error('MongoDB connection error; boo', err));

const { client_secret, client_id, redirect_uris } = credentials.web;
const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0] 
);

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

// --- ROUTES ---

// Route 1: Get Google Login URL
app.get('/api/auth/url', (req, res) => {
  console.log('\n=======================================');
  console.log('Frontend asks for the Google URL');
  const accountType = req.query.type || 'primary'; 
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline', 
    prompt: 'consent',
    scope: SCOPES,
    state: accountType 
  });
  console.log('Generated URL successfully. Sending to frontend...');
  res.json({ url: authUrl });
});

// Route 2: Google Callback (Now with 100% more Database!)
app.get('/oauth2callback', async (req, res) => {
  console.log('\n=======================================');
  console.log('Google just redirected the user back to us');
  const code = req.query.code;
  const accountType = req.query.state || 'primary'; 

  if (!code) {
    console.log('ERROR: Google did not send a code.');
    return res.status(400).send('No code provided');
  }

  try {
    console.log('Trading the secret code for VIP Tokens...');
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    console.log('Got the tokens!');

    console.log('Asking Google for the user profile...');
    const oauth2 = google.oauth2({ auth: oAuth2Client, version: 'v2' });
    const userInfo = await oauth2.userinfo.get();
    console.log(`👤 Profile found! Hello, ${userInfo.data.email}`);
    
    console.log('Talking to MongoDB...');
    let user = await User.findOne({ googleId: userInfo.data.id });
    
    if (user) {
      user.tokens = tokens;
      await user.save();
      console.log(`SUCCESS: Updated existing user: ${user.email}`);
    } else {
      user = new User({
        googleId: userInfo.data.id,
        email: userInfo.data.email,
        name: userInfo.data.name,
        tokens: tokens
      });
      await user.save();
      console.log(`SUCCESS: Created brand new user: ${user.email}`);
    }

    console.log(' Kicking user back to dashboard');
    res.redirect(`http://localhost:3000?token=${encodeURIComponent(JSON.stringify(tokens))}&type=${accountType}`);  } catch (error) {
    console.error('\nFATAL ERROR IN CALLBACK:');
    console.error(error);
    res.status(500).send('Authentication failed');
  }
});

// Route 3: Fetch real Google Calendar events using the Database
app.get('/api/calendar/events', async (req, res) => {
  const userEmail = req.query.email; // The frontend sends the email

  if (!userEmail) return res.status(400).send('Email is required');

  try {
    // 1. Find the user in MongoDB
    const user = await User.findOne({ email: userEmail });
    if (!user) return res.status(404).send('User not found in database');

    // 2. Set the credentials for this specific user
    oAuth2Client.setCredentials(user.tokens);
    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

    // 3. Define the time window (today to 7 days from now)
    const timeMin = new Date();
    timeMin.setHours(0, 0, 0, 0); // Start at the beginning of today
    
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 7);

    // 4. Ask Google for the events
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    // 5. Clean up the data before sending it to the frontend
    // Google sends a lot of junk; we only want the essentials!
    const events = response.data.items.map(event => ({
      id: event.id,
      title: event.summary,
      start: event.start.dateTime || event.start.date, // handles all-day events
      end: event.end.dateTime || event.end.date,
      description: event.description || '',
      location: event.location || ''
    }));

    res.json(events);
  } catch (error) {
    console.error('Error fetching from Google:', error);
    res.status(500).send('Failed to fetch calendar events');
  }
});

// Start the server
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});