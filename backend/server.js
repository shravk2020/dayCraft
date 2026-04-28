const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const credentials = require('./credentials.json'); // Importing your groupmate's file!

const app = express();
// Allow the React frontend on port 3000 to talk to this server
app.use(cors({ origin: 'http://localhost:3000' })); 
app.use(express.json());

// 1. Set up the Google OAuth Client using the credentials JSON
const { client_secret, client_id, redirect_uris } = credentials.web;
const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0] // This will use the http://localhost:8080/oauth2callback from your file
);

// We are asking Google for read-only access to the user's calendar
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

// --- ROUTES ---

// Route 1: The React frontend calls this to get the Google Login URL
app.get('/api/auth/url', (req, res) => {
  // NEW: We look for a ?type= query. If it's missing, we assume it's the 'primary' account.
  const accountType = req.query.type || 'primary'; 

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline', 
    prompt: 'consent',
    scope: SCOPES,
    state: accountType // <-- NEW: We hand Google the nametag here!
  });
  res.json({ url: authUrl });
});

// Route 2: Google redirects the user back here after they sign in
app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  // NEW: Google hands the nametag back to us in req.query.state!
  const accountType = req.query.state || 'primary'; 

  if (!code) return res.status(400).send('No code provided');

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    
    // NEW: We redirect back to React, but now we include BOTH the token AND the account type in the URL
    res.redirect(`http://localhost:3000?token=${encodeURIComponent(JSON.stringify(tokens))}&type=${accountType}`);
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.status(500).send('Authentication failed');
  }
});

// Route 3: Fetch the calendar events!
app.post('/api/calendar/events', async (req, res) => {
  try {
    const { tokens } = req.body;
    if (!tokens) return res.status(401).send('No tokens provided');

    oAuth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

    // Get events from today to 7 days from now
    const timeMin = new Date().toISOString();
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 7);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin,
      timeMax: timeMax.toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
    });

    res.json(response.data.items);
  } catch (error) {
    console.error('Error fetching calendar:', error);
    res.status(500).send('Failed to fetch events');
  }
});

// Start the server on Port 8080 to match your credentials file
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});