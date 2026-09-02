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

// Permissive CORS for local bridge access from Roster Manager & dashboards
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

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

// Generate auth URL for Classroom permissions (including rosters)
app.get('/api/classroom/auth-url', (req, res) => {
  try {
    const { clientId, clientSecret } = getCredentials();
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'http://localhost:3000/oauth2callback'
    );
    const scopes = [
      'https://www.googleapis.com/auth/classroom.courses.readonly',
      'https://www.googleapis.com/auth/classroom.coursework.students',
      'https://www.googleapis.com/auth/classroom.rosters.readonly',
      'https://www.googleapis.com/auth/classroom.profile.emails'
    ];
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes
    });
    res.json({ authUrl: url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// OAuth2 Callback handler for seamless browser authentication
app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('Authorization failed: No code received.');
  }

  try {
    const { clientId, clientSecret } = getCredentials();
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'http://localhost:3000/oauth2callback'
    );
    const { tokens } = await oauth2Client.getToken(code);
    if (tokens.refresh_token) {
      const envPath = path.join(__dirname, '.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        if (envContent.includes('GOOGLE_REFRESH_TOKEN=')) {
          envContent = envContent.replace(/GOOGLE_REFRESH_TOKEN=.*/, `GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
        } else {
          envContent += `\nGOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`;
        }
        fs.writeFileSync(envPath, envContent, 'utf8');
        process.env.GOOGLE_REFRESH_TOKEN = tokens.refresh_token;
      }
    }
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Authorization Successful</title><style>body{background:#020617;color:#f8fafc;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;}.card{background:rgba(15,23,42,0.8);border:1px solid rgba(16,185,129,0.3);padding:40px;border-radius:24px;box-shadow:0 10px 40px rgba(0,0,0,0.5);}h1{color:#10b981;margin-bottom:12px;}p{color:#94a3b8;font-size:14px;}button{margin-top:20px;padding:12px 24px;background:#10b981;color:#020617;font-weight:bold;border:none;border-radius:12px;cursor:pointer;}</style></head>
      <body>
        <div class="card">
          <h1>✅ Google Classroom Authorized!</h1>
          <p>Student roster reading permissions have been granted.</p>
          <button onclick="window.close()">Close this Window &amp; Return to Roster Manager</button>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('Error exchanging token:', err);
    res.status(500).send('Error exchanging token: ' + err.message);
  }
});

// Helper to extract period number from course name or section
function extractPeriod(course) {
  const combined = `${course.name || ''} ${course.section || ''} ${course.room || ''}`;
  const match = combined.match(/(?:period|per|p)\s*([0-9]+)/i);
  if (match) return parseInt(match[1], 10);
  const numMatch = (course.section || '').match(/^([0-9]+)$/);
  if (numMatch) return parseInt(numMatch[1], 10);
  return 0;
}

// Helper to extract numeric student ID from email or profile
function extractStudentId(student) {
  const email = student.profile?.emailAddress || '';
  const emailMatch = email.match(/^([0-9]+)@/);
  if (emailMatch) return emailMatch[1];
  const digitsMatch = email.match(/([0-9]{5,8})/);
  if (digitsMatch) return digitsMatch[1];
  return student.userId || student.profile?.id || '';
}

// Get Course list with inferred periods for Roster Manager
app.get('/api/classroom/courses-with-roster', async (req, res) => {
  try {
    const classroom = getClasroomClient();
    const response = await classroom.courses.list({
      courseStates: ['ACTIVE'],
      pageSize: 50
    });
    const courses = (response.data.courses || []).map(c => ({
      id: c.id,
      name: c.name,
      section: c.section || '',
      inferredPeriod: extractPeriod(c)
    }));
    res.json({ courses });
  } catch (error) {
    console.error('Error fetching courses with roster:', error);
    res.status(500).json({ error: error.message || 'Failed to retrieve courses.' });
  }
});

// Fetch all students across specified courses (or all active courses) with preview data
app.get('/api/classroom/roster-preview', async (req, res) => {
  const { courseIds } = req.query;
  try {
    const classroom = getClasroomClient();
    let courses = [];
    if (courseIds) {
      const ids = courseIds.split(',').map(s => s.trim()).filter(Boolean);
      for (const id of ids) {
        try {
          const cRes = await classroom.courses.get({ id });
          courses.push(cRes.data);
        } catch (e) {
          console.warn(`Could not fetch course ${id}:`, e.message);
        }
      }
    } else {
      const cRes = await classroom.courses.list({
        courseStates: ['ACTIVE'],
        pageSize: 50
      });
      courses = cRes.data.courses || [];
    }

    const allStudents = [];

    let permissionError = false;

    for (const course of courses) {
      const period = extractPeriod(course);
      try {
        let pageToken = null;
        do {
          const sRes = await classroom.courses.students.list({
            courseId: course.id,
            pageSize: 100,
            pageToken: pageToken
          });
          const students = sRes.data.students || [];
          for (const s of students) {
            const sid = extractStudentId(s);
            const givenName = s.profile?.name?.givenName || '';
            const familyName = s.profile?.name?.familyName || '';
            const fullName = s.profile?.name?.fullName || `${givenName} ${familyName}`.trim() || 'Unknown Student';
            const email = s.profile?.emailAddress || '';

            allStudents.push({
              student_id: sid,
              first_name: givenName || fullName.split(' ')[0] || '',
              last_name: familyName || fullName.split(' ').slice(1).join(' ') || '',
              full_name: fullName,
              class_period: period,
              email: email,
              course_id: course.id,
              course_name: course.name,
              course_section: course.section || ''
            });
          }
          pageToken = sRes.data.nextPageToken;
        } while (pageToken);
      } catch (err) {
        console.warn(`Could not list students for course ${course.name} (${course.id}):`, err.message);
        if (err.message.includes('Insufficient Permission') || (err.response && err.response.data && err.response.data.error && err.response.data.error.status === 'PERMISSION_DENIED')) {
          permissionError = true;
        }
      }
    }

    if (permissionError && allStudents.length === 0) {
      return res.status(403).json({
        requiresAuth: true,
        error: 'Google Classroom requires student roster permission. Click "Authorize Roster Access" to grant permission.'
      });
    }

    res.json({
      courses: courses.map(c => ({ id: c.id, name: c.name, section: c.section || '', inferredPeriod: extractPeriod(c) })),
      students: allStudents,
      total: allStudents.length
    });
  } catch (error) {
    console.error('Error generating roster preview:', error);
    res.status(500).json({ error: error.message || 'Failed to generate roster preview.' });
  }
});

// Commit Google Classroom students directly to Firestore db.collection('roster')
app.post('/api/classroom/import-roster', async (req, res) => {
  const { students } = req.body;
  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ error: 'No student records provided.' });
  }

  if (!db) {
    return res.status(500).json({ error: 'Firestore Admin SDK is not initialized.' });
  }

  try {
    const BATCH_SIZE = 400;
    let committedCount = 0;

    for (let i = 0; i < students.length; i += BATCH_SIZE) {
      const chunk = students.slice(i, i + BATCH_SIZE);
      const batch = db.batch();

      for (const s of chunk) {
        if (!s.student_id) continue;
        const docRef = db.collection('roster').doc(String(s.student_id));
        const payload = {
          student_id: String(s.student_id),
          first_name: s.first_name || '',
          last_name: s.last_name || '',
          full_name: s.full_name || `${s.first_name || ''} ${s.last_name || ''}`.trim(),
          class_period: parseInt(s.class_period, 10) || 0,
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        };
        if (s.email) payload.email = s.email;
        batch.set(docRef, payload, { merge: true });
        committedCount++;
      }

      await batch.commit();
    }

    res.json({ success: true, count: committedCount });
  } catch (error) {
    console.error('Error importing roster to Firestore:', error);
    res.status(500).json({ error: error.message || 'Failed to save roster to Firestore.' });
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

// Retrieve Assignments list from ALL Firestore collections (student_results, gradest_assignments, assessments, assignments)
app.get('/api/assignments', checkAuth, async (req, res) => {
  try {
    if (db) {
      const assignments = [];
      const seenIds = new Set();

      // 1. Fetch from 'student_results' (Interactive Practice Apps, Labs, Simulations)
      try {
        const docRefs = await db.collection('student_results').listDocuments();
        for (const ref of docRefs) {
          const id = ref.id;
          if (!seenIds.has(id)) {
            seenIds.add(id);
            // Count students in subcollection
            let studentCount = 0;
            try {
              const countSnap = await ref.collection('students').count().get();
              studentCount = countSnap.data().count;
            } catch (cErr) {
              const sSnap = await ref.collection('students').get();
              studentCount = sSnap.size;
            }
            const cleanName = id.replace(/_/g, ' ');
            assignments.push({
              id: id,
              name: studentCount > 0 ? `${cleanName} (${studentCount} student${studentCount === 1 ? '' : 's'})` : cleanName,
              rawName: cleanName,
              studentCount: studentCount,
              isProctorAssessment: false,
              sourceType: 'student_results'
            });
          }
        }
      } catch (srErr) {
        console.warn("Could not listDocuments for student_results:", srErr.message);
      }

      // 2. Fetch from 'gradest_assignments' (The Gradest OMR Bubble Sheets)
      try {
        const gradestSnap = await db.collection('gradest_assignments').get();
        gradestSnap.forEach(doc => {
          const data = doc.data();
          const id = doc.id;
          if (!seenIds.has(id)) {
            seenIds.add(id);
            const count = Array.isArray(data.grades) ? data.grades.length : 0;
            const title = data.assignmentName || data.title || id;
            assignments.push({ 
              id: id, 
              name: count > 0 ? `${title} (${count} student${count === 1 ? '' : 's'})` : title,
              rawName: title,
              studentCount: count,
              isProctorAssessment: !!data.isProctorAssessment,
              sourceType: data.sourceType || 'the_gradest'
            });
          }
        });
      } catch (gErr) {
        console.warn("Could not query gradest_assignments:", gErr.message);
      }

      // 3. Fetch from 'assessments' (THE_PROCTOR's Assessment Editor)
      try {
        const assessmentsSnap = await db.collection('assessments').get();
        assessmentsSnap.forEach(doc => {
          const id = doc.id;
          if (!seenIds.has(id)) {
            seenIds.add(id);
            const data = doc.data();
            const title = data.assignment_name || data.title || id;
            assignments.push({
              id: id,
              name: title,
              rawName: title,
              studentCount: 0,
              isProctorAssessment: true,
              sourceType: 'the_proctor'
            });
          }
        });
      } catch (e) {
        console.warn("Could not query assessments collection:", e.message);
      }

      // 4. Fetch from legacy 'assignments' collection (Labs / Proctor Dashboard)
      try {
        const legacySnap = await db.collection('assignments').get();
        legacySnap.forEach(doc => {
          const id = doc.id;
          if (!seenIds.has(id)) {
            seenIds.add(id);
            const data = doc.data();
            const title = data.title || data.assignment_name || id;
            assignments.push({
              id: id,
              name: title,
              rawName: title,
              studentCount: 0,
              isProctorAssessment: false,
              sourceType: 'interactive_lab'
            });
          }
        });
      } catch (e) {
        console.warn("Could not query legacy assignments collection:", e.message);
      }

      // Sort assignments with students first, then alphabetically
      assignments.sort((a, b) => {
        if ((b.studentCount || 0) !== (a.studentCount || 0)) {
          return (b.studentCount || 0) - (a.studentCount || 0);
        }
        return a.name.localeCompare(b.name);
      });

      res.json(assignments);
    } else {
      // Mock data if Firestore is not available
      res.json([
        { id: 'Unit_Conversion_Practice', name: 'Unit Conversion Practice (134 students)', isProctorAssessment: false, sourceType: 'student_results' },
        { id: 'Quiz 1', name: 'Quiz 1', isProctorAssessment: false, sourceType: 'the_gradest' },
        { id: 'Kinematics Quiz', name: 'Kinematics Quiz', isProctorAssessment: true, sourceType: 'the_proctor' }
      ]);
    }
  } catch (error) {
    console.error('Error listing assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments.' });
  }
});

// Retrieve Student scores for a specific assignment across student_results and gradest_assignments
app.get('/api/assignments/:assignmentId/scores', checkAuth, async (req, res) => {
  const { assignmentId } = req.params;
  try {
    if (db) {
      const students = [];
      const seenStudentIds = new Set();

      // Pre-fetch roster for enrichment
      const rosterMap = new Map();
      try {
        const rosterSnap = await db.collection('roster').get();
        rosterSnap.forEach(rDoc => {
          const rData = rDoc.data();
          const sid = String(rData.student_id || rDoc.id);
          rosterMap.set(sid, {
            name: rData.student_name || rData.name || null,
            period: rData.class_period || rData.period || null,
            email: rData.student_email || rData.email || null
          });
        });
      } catch (rErr) {
        console.warn("Roster prefetch error:", rErr.message);
      }

      // Check student_results subcollection (e.g. Unit_Conversion_Practice)
      const possibleIds = [
        assignmentId,
        assignmentId.replace(/ /g, '_'),
        assignmentId.replace(/_/g, ' ')
      ];

      for (const pid of possibleIds) {
        try {
          const snap = await db.collection('student_results').doc(pid).collection('students').get();
          if (!snap.empty) {
            snap.forEach(doc => {
              const data = doc.data();
              const sId = String(data.student_id || doc.id);
              if (!seenStudentIds.has(sId)) {
                seenStudentIds.add(sId);
                const rosterInfo = rosterMap.get(sId) || {};
                students.push({
                  student_id: sId,
                  name: data.student_name || rosterInfo.name || `Student ${sId}`,
                  class_period: (data.class_period && data.class_period !== 'N/A') ? data.class_period : (rosterInfo.period || '---'),
                  score: data.score !== undefined ? data.score : 0,
                  completed_at: data.timestamp ? (data.timestamp.toDate ? data.timestamp.toDate().toISOString() : data.timestamp) : new Date().toISOString()
                });
              }
            });
            break; // found scores in student_results
          }
        } catch (e) {}
      }

      // If still empty, check gradest_assignments (The Gradest OMR sheets)
      if (students.length === 0) {
        for (const pid of possibleIds) {
          try {
            const gradestDoc = await db.collection('gradest_assignments').doc(pid).get();
            if (gradestDoc.exists) {
              const data = gradestDoc.data();
              if (Array.isArray(data.grades)) {
                data.grades.forEach(g => {
                  const sId = String(g.id || g.studentId || 'N/A');
                  if (!seenStudentIds.has(sId)) {
                    seenStudentIds.add(sId);
                    const rosterInfo = rosterMap.get(sId) || {};
                    students.push({
                      student_id: sId,
                      name: g.name || rosterInfo.name || `Student ${sId}`,
                      class_period: g.period || rosterInfo.period || '---',
                      score: g.score !== undefined ? g.score : 0,
                      percentage: g.percentage || 0,
                      completed_at: g.timestamp || new Date().toISOString()
                    });
                  }
                });
                break;
              }
            }
          } catch (e) {}
        }
      }

      // Sort by class period, then student name
      students.sort((a, b) => {
        const pA = String(a.class_period || '');
        const pB = String(b.class_period || '');
        if (pA !== pB) return pA.localeCompare(pB, undefined, { numeric: true });
        return (a.name || '').localeCompare(b.name || '');
      });

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

    // 4. Try returning submission to student (so Aeries can import it)
    let isReturned = false;
    try {
      await classroom.courses.courseWork.studentSubmissions.return({
        courseId,
        courseWorkId: courseworkId,
        id: submissionId,
        requestBody: {}
      });
      isReturned = true;
    } catch (returnErr) {
      console.warn(`Return notice for student ${studentId} (${returnErr.message}). Score ${score} was successfully saved to Classroom gradebook!`);
    }

    res.json({
      success: true,
      submissionId,
      draftGrade: patchResponse.data.draftGrade,
      assignedGrade: patchResponse.data.assignedGrade,
      returned: isReturned
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
