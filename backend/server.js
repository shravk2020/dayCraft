const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User'); 
const credentials = require('./credentials.json');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB; HUZZAH!'))
  .catch((err) => console.error('MongoDB connection error:', err));

const { client_secret, client_id, redirect_uris } = credentials.web;
const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0] 
);

const BASE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];
const CALENDAR_SCOPES = [
  ...BASE_SCOPES, 
  'https://www.googleapis.com/auth/calendar.readonly'
];
const CLASSROOM_SCOPES = [
  ...BASE_SCOPES,
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly'
];

// --- ROUTES ---

// Route 1: Get Google Login URL (Dynamic Scopes & Nametags)
app.get('/api/auth/url', (req, res) => {
  const accountType = req.query.type || 'primary'; 
  const primaryEmail = req.query.primaryEmail || ''; 

  // If the integration ID has "classroom" in it, ask for Classroom keys!
  const requestedScopes = accountType.includes('classroom') ? CLASSROOM_SCOPES : CALENDAR_SCOPES;
  
  // Pack the nametag so Google can hand it back to us later
  const stateString = JSON.stringify({ type: accountType, primaryEmail: primaryEmail });

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline', 
    prompt: 'consent',
    scope: requestedScopes,
    state: stateString 
  });
  
  res.json({ url: authUrl });
});

// Route 2: Google Callback (Handles Primary Logins & Secondary Linking)
app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  
  // Unpack the nametag
  let stateObj = { type: 'primary', primaryEmail: '' };
  if (req.query.state) {
    try { stateObj = JSON.parse(req.query.state); } 
    catch (e) { stateObj = { type: req.query.state, primaryEmail: '' }; }
  }

  if (!code) return res.status(400).send('No code provided');

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ auth: oAuth2Client, version: 'v2' });
    const userInfo = await oauth2.userinfo.get();
    
    // SCEN A: Standard Primary Login
    if (stateObj.type === 'primary' || !stateObj.primaryEmail) {
      let user = await User.findOne({ googleId: userInfo.data.id });
      if (user) {
        user.tokens = tokens;
        await user.save();
      } else {
        user = new User({
          googleId: userInfo.data.id,
          email: userInfo.data.email,
          name: userInfo.data.name,
          tokens: tokens
        });
        await user.save();
        console.log(`Created brand new user: ${user.email}`);
      }
    } 
    // SCEN B: Linking a Secondary Account (Calendar or Classroom)
    else {
      let primaryUser = await User.findOne({ email: stateObj.primaryEmail });
      
      if (primaryUser) {
        const existingIndex = primaryUser.connectedCalendars.findIndex(c => c.email === userInfo.data.email && c.accountType === stateObj.type);
        
        if (existingIndex >= 0) {
          primaryUser.connectedCalendars[existingIndex].tokens = tokens; // Refresh tokens
        } else {
          primaryUser.connectedCalendars.push({
            accountId: userInfo.data.id,
            email: userInfo.data.email,
            accountType: stateObj.type, // 'school', 'classroom_123', etc.
            tokens: tokens
          });
        }
        await primaryUser.save();
        console.log(`SUCCESS: Linked ${userInfo.data.email} to ${primaryUser.email} as ${stateObj.type}!`);
      }
    }

    res.redirect(`http://localhost:3000?token=${encodeURIComponent(JSON.stringify(tokens))}&type=${stateObj.type}`);
  } catch (error) {
    console.error('Error getting tokens or saving user:', error);
    res.status(500).send('Authentication failed');
  }
});

// Route 3: Fetches ALL Google Calendar Events
app.get('/api/calendar/events', async (req, res) => {
  const userEmail = req.query.email;
  if (!userEmail) return res.status(400).send('Email is required');

  try {
    const user = await User.findOne({ email: userEmail });
    if (!user) return res.status(404).send('User not found');

    const timeMin = new Date();
    timeMin.setDate(timeMin.getDate() - 30);
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 60);

    let allEvents = [];

    const fetchFromAccount = async (tokens, label) => {
      const auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
      auth.setCredentials(tokens);
      const calendar = google.calendar({ version: 'v3', auth });

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items.map(event => ({
        id: event.id,
        title: event.summary,
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        source: label 
      }));
    };

    // Fetch primary
    console.log(`Fetching primary calendar for ${user.email}...`);
    const primaryEvents = await fetchFromAccount(user.tokens, 'primary');
    allEvents = [...primaryEvents];

    // Fetch linked calendars
    const calendarAccounts = user.connectedCalendars.filter(c => !c.accountType.includes('classroom'));
    for (const account of calendarAccounts) {
      console.log(`Fetching linked calendar for ${account.email}...`);
      try {
        const linkedEvents = await fetchFromAccount(account.tokens, account.accountType);
        allEvents = [...allEvents, ...linkedEvents];
      } catch (err) {
        console.error(`Failed to fetch from linked account ${account.email}:`, err.message);
      }
    }

    console.log(`Success! Combined ${allEvents.length} calendar events.`);
    res.json(allEvents);

  } catch (error) {
    console.error('Master Fetch Error:', error);
    res.status(500).send('Failed to aggregate calendar events');
  }
});

// Route 4: Fetch Google Classroom Tasks
app.get('/api/classroom/tasks', async (req, res) => {
  const userEmail = req.query.email;
  if (!userEmail) return res.status(400).send('Email is required');

  try {
    const user = await User.findOne({ email: userEmail });
    if (!user) return res.status(404).send('User not found');

    let allTasks = [];
    
    // Find all accounts tagged as 'classroom'
    const classroomAccounts = user.connectedCalendars.filter(c => c.accountType.includes('classroom'));

    for (const account of classroomAccounts) {
      console.log(`Fetching classroom tasks for ${account.email}...`);
      const auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
      auth.setCredentials(account.tokens);
      const classroom = google.classroom({ version: 'v1', auth });

      const coursesRes = await classroom.courses.list({ courseStates: ['ACTIVE'] });
      const courses = coursesRes.data.courses || [];

      for (const course of courses) {
        try {
          const workRes = await classroom.courses.courseWork.list({
            courseId: course.id,
            orderBy: 'dueDate desc'
          });

          const courseWork = workRes.data.courseWork || [];

          const mappedTasks = courseWork.map(work => {
            let dueDateStr = undefined;
            if (work.dueDate) {
              dueDateStr = `${work.dueDate.year}-${String(work.dueDate.month).padStart(2, '0')}-${String(work.dueDate.day).padStart(2, '0')}`;
            }

            return {
              id: work.id,
              title: work.title,
              source: course.name,
              duration: 60, // Default duration
              dueDate: dueDateStr,
              description: work.description || '',
              flexibility: 'Flexible'
            };
          });

          allTasks = [...allTasks, ...mappedTasks];
        } catch (err) {
          console.error(`Skipped course ${course.name} due to permissions/error.`);
        }
      }
    }
    
    console.log(`Success! Found ${allTasks.length} homework assignments.`);
    res.json(allTasks);

  } catch (error) {
    console.error('Classroom Fetch Error:', error);
    res.status(500).send('Failed to fetch classroom tasks');
  }
});

// Route 5: Disconnect an Integration
app.delete('/api/auth/disconnect', async (req, res) => {
  const { primaryEmail, integrationId } = req.body;

  try {
    const user = await User.findOne({ email: primaryEmail });
    if (!user) return res.status(404).send('User not found');

    user.connectedCalendars = user.connectedCalendars.filter(
      calendar => calendar.accountType !== integrationId
    );

    await user.save();
    console.log(`SUCCESS: Disconnected ${integrationId} from ${primaryEmail}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting calendar:', error);
    res.status(500).send('Failed to disconnect');
  }
});

// Start the server
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});