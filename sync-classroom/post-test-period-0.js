const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

function getCredentials() {
  const files = fs.readdirSync(__dirname);
  const secretFile = files.find(f => f.startsWith('client_secret_') && f.endsWith('.json'));
  if (secretFile) {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, secretFile), 'utf8'));
    const credentials = data.web || data.installed;
    if (credentials) {
      return {
        clientId: credentials.client_id,
        clientSecret: credentials.client_secret
      };
    }
  }
  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET
  };
}

function getClassroomClient() {
  const { clientId, clientSecret } = getCredentials();
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Google Classroom OAuth credentials.');
  }
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return google.classroom({ version: 'v1', auth: oauth2Client });
}

const COURSE_PERIOD_0 = {
  courseId: '875053343151',
  name: 'Period 0 - Physics H - 26/27'
};

async function main() {
  const classroom = getClassroomClient();
  const args = process.argv.slice(2);

  // If --delete is passed
  if (args[0] === '--delete') {
    const idToDelete = args[1];
    if (!idToDelete) {
      console.error('Please specify an assignment ID to delete: node post-test-period-0.js --delete <ID>');
      process.exit(1);
    }
    console.log(`Deleting test assignment ${idToDelete} from ${COURSE_PERIOD_0.name}...`);
    await classroom.courses.courseWork.delete({
      courseId: COURSE_PERIOD_0.courseId,
      id: idToDelete
    });
    console.log(`✓ Assignment ${idToDelete} deleted successfully!`);
    return;
  }

  const timestamp = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const testTitle = `[Test] Display Name Verification (${timestamp})`;

  console.log(`Creating test assignment in ${COURSE_PERIOD_0.name}...`);
  const res = await classroom.courses.courseWork.create({
    courseId: COURSE_PERIOD_0.courseId,
    requestBody: {
      title: testTitle,
      description: 'Temporary test assignment to verify the public-facing application name on the Classroom stream.\n\nThis can be safely deleted at any time.',
      workType: 'ASSIGNMENT',
      state: 'PUBLISHED',
      maxPoints: 0
    }
  });

  console.log('\n====================================================');
  console.log('🎉 Test assignment successfully posted to Period 0!');
  console.log(`📋 Title: ${res.data.title}`);
  console.log(`🆔 Assignment ID: ${res.data.id}`);
  console.log(`🔗 Direct Classroom Link: ${res.data.alternateLink}`);
  console.log('====================================================');
  console.log(`\nTo delete this test post later, run:`);
  console.log(`node post-test-period-0.js --delete ${res.data.id}\n`);
}

main().catch(err => {
  console.error('Failed to post test assignment:', err.message);
  process.exit(1);
});
