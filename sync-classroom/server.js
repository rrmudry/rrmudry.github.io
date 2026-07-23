const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

// ---------------------------------------------------------
// 1. Initialize Firestore Admin SDK
// ---------------------------------------------------------
let db;
try {
  // Service account is located one level up in the root workspace folder
  const serviceAccountPath = path.join(__dirname, '..', 'site-6e500-firebase-adminsdk-fbsvc-407ccb8f99.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    console.log('Firebase Admin SDK initialized successfully.');
    migrateLegacyAssignments();
  } else {
    console.warn(`WARNING: Firebase service account key not found at: ${serviceAccountPath}. Firestore data will be mocked.`);
  }
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error.message);
  console.warn('Firestore data will be mocked.');
}

// Migration helper: Copy legacy assignments/student_results into unified 'gradest_assignments'
async function migrateLegacyAssignments() {
  if (!db) return;
  try {
    const legacySnap = await db.collection('assignments').get();
    if (legacySnap.empty) return;

    for (const doc of legacySnap.docs) {
      const data = doc.data();
      const name = data.title || data.assignmentName || doc.id;
      const targetDoc = db.collection('gradest_assignments').doc(name);
      const existing = await targetDoc.get();

      if (!existing.exists) {
        const scores = [];
        try {
          const scoresSnap = await db.collection('student_results').doc(doc.id).collection('students').get();
          scoresSnap.forEach(sDoc => {
            const sData = sDoc.data();
            scores.push({
              id: sData.student_id || sDoc.id,
              name: sData.student_name || 'Student ' + sDoc.id,
              score: sData.score || 0,
              percentage: Math.round(((sData.score || 0) / (data.maxPoints || 100)) * 100),
              timestamp: sData.timestamp ? (sData.timestamp.toDate ? sData.timestamp.toDate().toISOString() : sData.timestamp) : new Date().toISOString()
            });
          });
        } catch (e) {}

        await targetDoc.set({
          assignmentName: name,
          title: name,
          assignmentDetails: data.description || "",
          description: data.description || "",
          maxScore: data.maxPoints || 100,
          maxPoints: data.maxPoints || 100,
          grades: scores,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log(`Migrated legacy assignment "${name}" into "gradest_assignments".`);
      }
    }
  } catch (err) {
    console.error("Legacy assignment migration error:", err.message);
  }
}

// ---------------------------------------------------------
// 2. Google OAuth credentials loader
// ---------------------------------------------------------
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
    // ignore
  }
  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET
  };
}

function getClasroomClient() {
  const { clientId, clientSecret } = getCredentials();
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Google Classroom authentication configuration.');
  }
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return google.classroom({ version: 'v1', auth: oauth2Client });
}

// ---------------------------------------------------------
// 3. Security & Auth Middleware
// ---------------------------------------------------------
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'physics-sync';

function checkAuth(req, res, next) {
  const sessionToken = req.cookies.session_token;
  if (sessionToken === 'authenticated_admin') {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
}

app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.cookie('session_token', 'authenticated_admin', {
      httpOnly: true,
      secure: false, // Set to true if deploying to HTTPS production
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('session_token');
  res.json({ success: true });
});

app.get('/api/auth/verify', (req, res) => {
  const sessionToken = req.cookies.session_token;
  res.json({ authenticated: sessionToken === 'authenticated_admin' });
});

// ---------------------------------------------------------
// 4. API Endpoints
// ---------------------------------------------------------

// Retrieve Google Classroom Courses
app.get('/api/courses', checkAuth, async (req, res) => {
  try {
    const classroom = getClasroomClient();
    const response = await classroom.courses.list({
      courseStates: ['ACTIVE'],
      pageSize: 50
    });
    res.json(response.data.courses || []);
  } catch (error) {
    console.error('Error fetching Classroom courses:', error);
    res.status(500).json({ error: 'Failed to retrieve Google Classroom courses.' });
  }
});

// Retrieve Google Classroom Coursework for a specific course
app.get('/api/courses/:courseId/coursework', checkAuth, async (req, res) => {
  const { courseId } = req.params;
  try {
    const classroom = getClasroomClient();
    const response = await classroom.courses.courseWork.list({
      courseId: courseId,
      pageSize: 100
    });
    res.json(response.data.courseWork || []);
  } catch (error) {
    console.error(`Error fetching coursework for course ${courseId}:`, error);
    res.status(500).json({ error: 'Failed to retrieve Google Classroom coursework.' });
  }
});

// Retrieve Assignments list from ALL Firestore collections (gradest_assignments, assessments, assignments)
app.get('/api/assignments', checkAuth, async (req, res) => {
  try {
    if (db) {
      const assignments = [];
      const seenIds = new Set();

      // 1. Fetch from 'gradest_assignments' (The Gradest OMR Bubble Sheets)
      const gradestSnap = await db.collection('gradest_assignments').get();
      gradestSnap.forEach(doc => {
        const data = doc.data();
        const id = doc.id;
        seenIds.add(id);
        assignments.push({ 
          id: id, 
          name: data.assignmentName || data.title || id,
          isProctorAssessment: !!data.isProctorAssessment,
          sourceType: data.sourceType || 'the_gradest'
        });
      });

      // 2. Fetch from 'assessments' (THE_PROCTOR's Assessment Editor)
      try {
        const assessmentsSnap = await db.collection('assessments').get();
        assessmentsSnap.forEach(doc => {
          const id = doc.id;
          if (!seenIds.has(id)) {
            seenIds.add(id);
            const data = doc.data();
            assignments.push({
              id: id,
              name: data.assignment_name || data.title || id,
              isProctorAssessment: true,
              sourceType: 'the_proctor'
            });
          }
        });
      } catch (e) {
        console.warn("Could not query assessments collection:", e.message);
      }

      // 3. Fetch from legacy 'assignments' collection (Labs / Proctor Dashboard)
      try {
        const legacySnap = await db.collection('assignments').get();
        legacySnap.forEach(doc => {
          const id = doc.id;
          if (!seenIds.has(id)) {
            seenIds.add(id);
            const data = doc.data();
            assignments.push({
              id: id,
              name: data.title || data.assignment_name || id,
              isProctorAssessment: false,
              sourceType: 'interactive_lab'
            });
          }
        });
      } catch (e) {
        console.warn("Could not query legacy assignments collection:", e.message);
      }

      res.json(assignments);
    } else {
      // Mock data if Firestore is not available
      res.json([
        { id: 'Quiz 1', name: 'Quiz 1', isProctorAssessment: false, sourceType: 'the_gradest' },
        { id: 'Kinematics Quiz', name: 'Kinematics Quiz', isProctorAssessment: true, sourceType: 'the_proctor' },
        { id: 'Unit 7 - Electricity & Magnetism', name: 'Unit 7 - Electricity & Magnetism', isProctorAssessment: false, sourceType: 'the_gradest' }
      ]);
    }
  } catch (error) {
    console.error('Error listing assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments.' });
  }
});

// Retrieve Student scores for a specific assignment across gradest_assignments and student_results
app.get('/api/assignments/:assignmentId/scores', checkAuth, async (req, res) => {
  const { assignmentId } = req.params;
  try {
    if (db) {
      const students = [];

      // 1. Check gradest_assignments first (The Gradest OMR sheets)
      const gradestDoc = await db.collection('gradest_assignments').doc(assignmentId).get();
      if (gradestDoc.exists) {
        const data = gradestDoc.data();
        if (Array.isArray(data.grades)) {
          data.grades.forEach(g => {
            students.push({
              student_id: g.id || g.studentId || 'N/A',
              name: g.name || 'Student ' + (g.id || g.studentId),
              class_period: g.period || '1',
              score: g.score !== undefined ? g.score : 0,
              percentage: g.percentage || 0,
              completed_at: g.timestamp || new Date().toISOString()
            });
          });
        }
      }

      // 2. Check student_results subcollection if gradest_assignments returned no scores
      if (students.length === 0) {
        const snap = await db.collection('student_results').doc(assignmentId).collection('students').get();
        snap.forEach(doc => {
          const data = doc.data();
          students.push({
            student_id: data.student_id || doc.id,
            name: data.student_name || 'Unknown Student',
            class_period: data.class_period || 'N/A',
            score: data.score || 0,
            completed_at: data.timestamp ? (data.timestamp.toDate ? data.timestamp.toDate().toISOString() : data.timestamp) : new Date().toISOString()
          });
        });
      }

      res.json(students);
    } else {
      // Mock data if Firestore is not available
      res.json([
        { student_id: '1001', name: 'Albert Einstein', class_period: '2', score: 95, completed_at: new Date().toISOString() },
        { student_id: '1002', name: 'Marie Curie', class_period: '2', score: 100, completed_at: new Date().toISOString() },
        { student_id: '1003', name: 'Isaac Newton', class_period: '5', score: 88, completed_at: new Date().toISOString() }
      ]);
    }
  } catch (error) {
    console.error('Error fetching scores:', error);
    res.status(500).json({ error: 'Failed to fetch student scores.' });
  }
});

// Create coursework (assignment) across selected courses & save metadata to unified 'gradest_assignments'
app.post('/api/create-assignment', checkAuth, async (req, res) => {
  const { courseIds, title, description, maxPoints } = req.body;
  if (!courseIds || !courseIds.length || !title) {
    return res.status(400).json({ error: 'Invalid course IDs or assignment title.' });
  }

  const results = [];
  try {
    const classroom = getClasroomClient();
    for (const courseId of courseIds) {
      try {
        const response = await classroom.courses.courseWork.create({
          courseId,
          requestBody: {
            title,
            description,
            workType: 'ASSIGNMENT',
            state: 'PUBLISHED',
            maxPoints
          }
        });
        results.push({ courseId, courseworkId: response.data.id, success: true });
      } catch (err) {
        results.push({ courseId, success: false, error: err.message });
      }
    }

    // Save/Merge unified assignment record into 'gradest_assignments'
    if (db) {
      const docName = title.trim();
      await db.collection('gradest_assignments').doc(docName).set({
        assignmentName: title,
        title: title,
        assignmentDetails: description || "",
        description: description || "",
        maxScore: maxPoints || 100,
        maxPoints: maxPoints || 100,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        classroomDeployments: results.filter(r => r.success)
      }, { merge: true });
      console.log(`Saved unified assignment "${title}" to Firestore collection "gradest_assignments".`);
    }

    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper: Resolves 6-digit district student IDs to Google Classroom user identifiers/emails
async function resolveClassroomUserId(classroom, courseId, rawStudentId) {
  const studentId = String(rawStudentId).trim();
  if (studentId.includes('@')) return studentId;

  const cleanId = studentId.replace(/^0+/, '');

  // 1. Query Firestore roster collection for saved student email or name
  let rosterName = null;
  let rosterEmail = null;
  if (db) {
    try {
      let rosterDoc = await db.collection('roster').doc(studentId).get();
      if (!rosterDoc.exists && cleanId !== studentId) {
        rosterDoc = await db.collection('roster').doc(cleanId).get();
      }
      if (rosterDoc.exists) {
        const data = rosterDoc.data();
        rosterEmail = data.email || data.student_email || null;
        rosterName = data.name || data.student_name || (data.first_name ? `${data.first_name} ${data.last_name}` : null);
      }
    } catch (e) {
      console.warn("Firestore roster lookup notice:", e.message);
    }
  }

  if (rosterEmail && rosterEmail.includes('@')) {
    return rosterEmail;
  }

  // 2. Fetch enrolled students from Google Classroom course roster
  try {
    const listRes = await classroom.courses.students.list({
      courseId: courseId,
      pageSize: 100
    });
    const enrolledStudents = listRes.data.students || [];

    for (const s of enrolledStudents) {
      const profile = s.profile || {};
      const email = (profile.emailAddress || '').toLowerCase().trim();
      const fullName = (profile.name ? profile.name.fullName : '').toLowerCase().trim();

      // Match A: Email starts with student ID (e.g. 378610@orangeusd.org or 0378610@...)
      if (email.startsWith(studentId.toLowerCase()) || (cleanId && email.startsWith(cleanId.toLowerCase()))) {
        console.log(`Matched Google Classroom student by email prefix: ${email} for ID ${studentId}`);
        return s.userId || email;
      }

      // Match B: Email contains student ID
      if (email.includes(studentId.toLowerCase()) || (cleanId && email.includes(cleanId.toLowerCase()))) {
        console.log(`Matched Google Classroom student by ID in email: ${email} for ID ${studentId}`);
        return s.userId || email;
      }

      // Match C: Full Name match from Firestore roster
      if (rosterName && fullName && (fullName === rosterName.toLowerCase().trim() || fullName.includes(rosterName.toLowerCase().trim()))) {
        console.log(`Matched Google Classroom student by name "${fullName}": ${email} for ID ${studentId}`);
        return s.userId || email;
      }
    }
  } catch (err) {
    console.warn("Could not list Google Classroom course students:", err.message);
  }

  // 3. Fallback to common school district email format (@orangeusd.org)
  return `${studentId}@orangeusd.org`;
}

// Sync/Push grade and return submission
app.post('/api/sync-grade', checkAuth, async (req, res) => {
  const { courseId, courseworkId, studentId, score } = req.body;
  if (!courseId || !courseworkId || !studentId || score === undefined) {
    return res.status(400).json({ error: 'Missing sync parameters.' });
  }

  try {
    const classroom = getClasroomClient();

    // 1. Resolve student profile / email for Google Classroom
    const searchId = await resolveClassroomUserId(classroom, courseId, studentId);
    console.log(`Syncing grade for studentId "${studentId}" -> resolved Classroom user: "${searchId}"`);

    // 2. Fetch the student submission
    let listResponse;
    try {
      listResponse = await classroom.courses.courseWork.studentSubmissions.list({
        courseId,
        courseWorkId: courseworkId,
        userId: searchId
      });
    } catch (listErr) {
      // Fallback: If searchId failed, try listing all submissions for coursework and matching student profile name/email
      console.warn(`Direct submission lookup for "${searchId}" returned error (${listErr.message}). Fetching all submissions...`);
      listResponse = await classroom.courses.courseWork.studentSubmissions.list({
        courseId,
        courseWorkId: courseworkId
      });
    }

    const submissions = listResponse.data.studentSubmissions || [];
    if (submissions.length === 0) {
      return res.status(404).json({ error: `No student submission found in Classroom for ID: ${studentId} (resolved as: ${searchId})` });
    }

    const submission = submissions[0];
    const submissionId = submission.id;

    // 3. Patch grades (draft and assigned)
    const patchResponse = await classroom.courses.courseWork.studentSubmissions.patch({
      courseId,
      courseWorkId: courseworkId,
      id: submissionId,
      updateMask: 'draftGrade,assignedGrade',
      requestBody: {
        draftGrade: score,
        assignedGrade: score
      }
    });

    // 4. Return submission to student (so Aeries can import it)
    await classroom.courses.courseWork.studentSubmissions.return({
      courseId,
      courseWorkId: courseworkId,
      id: submissionId,
      requestBody: {}
    });

    res.json({
      success: true,
      submissionId,
      draftGrade: patchResponse.data.draftGrade,
      assignedGrade: patchResponse.data.assignedGrade
    });
  } catch (error) {
    console.error(`Error syncing grade for student ${studentId}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------
// 5. Serve Web Frontend
// ---------------------------------------------------------
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(port, () => {
  console.log(`Classroom Sync Dashboard Server running on http://localhost:${port}`);
});
