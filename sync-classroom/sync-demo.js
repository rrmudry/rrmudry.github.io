const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

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
        return {
          clientId: credentials.client_id,
          clientSecret: credentials.client_secret
        };
      }
    }
  } catch (e) {
    // Ignore error and fall back
  }

  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET
  };
}

/**
 * Creates and returns an authorized Google Classroom API client.
 * Uses the saved Refresh Token, Client ID, and Client Secret.
 */
function getClasroomClient() {
  const { clientId, clientSecret } = getCredentials();
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing authentication configuration. Ensure GOOGLE_REFRESH_TOKEN is set in your .env file, and client_secret_*.json is present or credentials are set in .env.');
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  return google.classroom({ version: 'v1', auth: oauth2Client });
}

/**
 * 3.a) Programmatically create an assignment across multiple course IDs.
 * Note: An assignment created by your API client is "owned" by your project,
 * which grants it the necessary permissions to modify student submissions.
 *
 * @param {Array<string>} courseIds - List of Google Classroom Course IDs.
 * @param {Object} assignmentDetails - Details of the coursework.
 * @returns {Promise<Array<Object>>} List of created courseWork objects with courseId and courseworkId.
 */
async function createAssignmentAcrossCourses(courseIds, assignmentDetails) {
  const classroom = getClasroomClient();
  const results = [];

  console.log(`Creating assignment "${assignmentDetails.title}" across ${courseIds.length} course(s)...`);

  for (const courseId of courseIds) {
    try {
      const response = await classroom.courses.courseWork.create({
        courseId: courseId,
        requestBody: {
          title: assignmentDetails.title,
          description: assignmentDetails.description,
          workType: 'ASSIGNMENT',
          state: 'PUBLISHED', // Options: DRAFT, PUBLISHED
          maxPoints: assignmentDetails.maxPoints,
          // You can also add dueDate, dueTime, materials, etc.
        }
      });

      console.log(`Successfully created assignment in Course [${courseId}]. Coursework ID: ${response.data.id}`);
      results.push({
        courseId: courseId,
        courseworkId: response.data.id,
        title: response.data.title,
        alternateLink: response.data.alternateLink
      });
    } catch (error) {
      console.error(`Failed to create assignment in Course [${courseId}]:`, error.message);
    }
  }

  return results;
}

/**
 * 3.b) Push/patch a student's score to a specific assignment submission.
 * Helper function to find the submission ID for a student by their email/ID, then update it.
 *
 * @param {string} courseId - The Course ID.
 * @param {string} courseworkId - The Coursework (assignment) ID.
 * @param {string} studentEmail - The student's primary email address (or user ID).
 * @param {number} score - The score to assign.
 * @returns {Promise<string>} The updated student submission ID.
 */
async function updateStudentScore(courseId, courseworkId, studentEmail, score) {
  const classroom = getClasroomClient();

  console.log(`Finding submission for student ${studentEmail} in Course [${courseId}]...`);

  // 1. List submissions filtering by the student's email/id
  const listResponse = await classroom.courses.courseWork.studentSubmissions.list({
    courseId: courseId,
    courseWorkId: courseworkId,
    userId: studentEmail // Filters to only retrieve this specific student's submissions
  });

  const submissions = listResponse.data.studentSubmissions;
  if (!submissions || submissions.length === 0) {
    throw new Error(`No student submission found for student ${studentEmail} in coursework ${courseworkId}.`);
  }

  const submissionId = submissions[0].id;
  console.log(`Found submission ID: ${submissionId}. Updating grade to ${score}...`);

  // 2. Patch the draftGrade and assignedGrade. 
  // UpdateMask specifies which fields are modified.
  const patchResponse = await classroom.courses.courseWork.studentSubmissions.patch({
    courseId: courseId,
    courseWorkId: courseworkId,
    id: submissionId,
    updateMask: 'draftGrade,assignedGrade',
    requestBody: {
      draftGrade: score,
      assignedGrade: score
    }
  });

  console.log(`Successfully patched score to ${score} (Draft: ${patchResponse.data.draftGrade}, Assigned: ${patchResponse.data.assignedGrade}).`);
  return submissionId;
}

/**
 * 3.c) Explicitly set the student assignment state to "RETURNED".
 * This makes the grade official and visible to gradebooks like Aeries.
 *
 * @param {string} courseId - The Course ID.
 * @param {string} courseworkId - The Coursework ID.
 * @param {string} submissionId - The Student Submission ID.
 */
async function returnStudentSubmission(courseId, courseworkId, submissionId) {
  const classroom = getClasroomClient();

  console.log(`Returning student submission ${submissionId} to student...`);

  // Call the return endpoint.
  // Note: Request body must be empty object, not completely empty.
  await classroom.courses.courseWork.studentSubmissions.return({
    courseId: courseId,
    courseWorkId: courseworkId,
    id: submissionId,
    requestBody: {} 
  });

  console.log(`Successfully returned submission ${submissionId}. Grade is now finalized and visible to external gradebooks.`);
}

/**
 * Main orchestrator demonstrating how to use the functions sequentially.
 */
async function runDemo() {
  try {
    console.log('--- Starting Classroom Grade Sync Demo ---\n');

    // Example 1: Creating an assignment across multiple courses
    const targetCourses = ['1234567890', '0987654321']; // Replace with actual course IDs
    const assignmentDetails = {
      title: 'Physics Bell-Ringer: Kinematics Quiz',
      description: 'Please answer the bell-ringer questions in the web panel.',
      maxPoints: 10
    };

    // Note: To test this run, you would uncomment the operations below with valid IDs
    /*
    const createdAssignments = await createAssignmentAcrossCourses(targetCourses, assignmentDetails);
    
    if (createdAssignments.length > 0) {
      const demoAssignment = createdAssignments[0];
      const studentEmail = 'student@school.edu'; // Replace with a test student email
      const studentScore = 9.5;

      // Update the student score
      const submissionId = await updateStudentScore(
        demoAssignment.courseId, 
        demoAssignment.courseworkId, 
        studentEmail, 
        studentScore
      );

      // Return the submission
      await returnStudentSubmission(
        demoAssignment.courseId, 
        demoAssignment.courseworkId, 
        submissionId
      );
    }
    */
    
    console.log('\nDemo script template loaded successfully. Uncomment the operations inside sync-demo.js to run with live data.');
  } catch (error) {
    console.error('Error running demo script:', error);
  }
}

// Execute demo if run directly
if (require.main === module) {
  runDemo();
}

module.exports = {
  getClasroomClient,
  createAssignmentAcrossCourses,
  updateStudentScore,
  returnStudentSubmission
};
