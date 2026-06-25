const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

// Helper to load credentials from JSON file or env variables
function getCredentials() {
  try {
    const files = fs.readdirSync(__dirname);
    const secretFile = files.find(f => f.startsWith('client_secret_') && f.endsWith('.json'));
    if (secretFile) {
      const raw = fs.readFileSync(path.join(__dirname, secretFile), 'utf8');
      const data = JSON.parse(raw);
      const credentials = data.web || data.installed;
      if (credentials) {
        // Use the first redirect URI from JSON if available, otherwise default to local port 3000
        const redirect = credentials.redirect_uris?.[0] || `http://localhost:${process.env.PORT || 3000}/oauth2callback`;
        return {
          clientId: credentials.client_id,
          clientSecret: credentials.client_secret,
          redirectUri: redirect
        };
      }
    }
  } catch (e) {
    console.warn('Note: Could not automatically read client_secret JSON:', e.message);
  }

  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: `http://localhost:${process.env.PORT || 3000}/oauth2callback`
  };
}

const { clientId, clientSecret, redirectUri } = getCredentials();
const parsedRedirect = url.parse(redirectUri);
const port = parsedRedirect.port || 3000;
const pathName = parsedRedirect.pathname || '/oauth2callback';

if (!clientId || !clientSecret) {
  console.error('Error: Client ID and Client Secret could not be loaded. Please ensure your client_secret_*.json file is present or configure .env');
  process.exit(1);
}

// Initialize the OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  redirectUri
);

// Define Classroom API scopes requested by the user
const scopes = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.students'
];

// Generate the authorization URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // Request a refresh token
  prompt: 'consent',      // Force consent screen to ensure refresh token is returned
  scope: scopes
});

// Start a local HTTP server to handle the redirect callback
const server = http.createServer(async (req, res) => {
  try {
    const parsedUrl = url.parse(req.url, true);
    
    if (parsedUrl.pathname === pathName) {
      const code = parsedUrl.query.code;
      
      if (!code) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Authorization failed: No code received in query string.');
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h1>Authorization Successful!</h1><p>You can close this tab and return to the console.</p>');
      
      console.log('\nExchanging authorization code for tokens...');
      const { tokens } = await oauth2Client.getToken(code);
      
      console.log('\n==================================================');
      console.log('SUCCESS! Capture your tokens below:');
      console.log('==================================================');
      console.log('Refresh Token:', tokens.refresh_token);
      console.log('Access Token: ', tokens.access_token);
      console.log('Expiry Date:  ', new Date(tokens.expiry_date).toISOString());
      console.log('==================================================\n');
      
      if (!tokens.refresh_token) {
        console.warn('WARNING: No Refresh Token was returned. This usually happens if you already authorized this app.');
        console.warn('To get a new Refresh Token, visit your Google Account security settings, revoke access to "Mudry Gradebook Sync", and run this script again.\n');
      } else {
        console.log('Save the Refresh Token securely in your backend config / environment variables.');
      }
      
      // Clean shutdown
      server.close(() => {
        console.log('Local callback server stopped. Exiting.');
        process.exit(0);
      });
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  } catch (error) {
    console.error('Error handling redirect request:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
});

server.listen(port, () => {
  console.log('\n==================================================');
  console.log('Google Classroom Sync: Local Auth Flow');
  console.log('==================================================');
  console.log(`Callback listener running on: http://localhost:${port}`);
  console.log('\nClick or copy the link below to sign in and authorize the application:\n');
  console.log(authUrl);
  console.log('\n==================================================\n');
});
