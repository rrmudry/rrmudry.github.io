#!/usr/bin/env node
const { google } = require('googleapis');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// 1. Firebase Admin Init
const serviceAccountPath = path.join(__dirname, '..', 'site-6e500-firebase-adminsdk-fbsvc-407ccb8f99.json');
const serviceAccount = require(serviceAccountPath);
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

// 2. Classroom Client Init
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
  } catch (e) {}

  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET
  };
}

const { clientId, clientSecret } = getCredentials();
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
oauth2Client.setCredentials({ refresh_token: refreshToken });
const classroom = google.classroom({ version: 'v1', auth: oauth2Client });

function extractPeriod(courseName) {
  if (!courseName) return null;
  if (/\bTA\b/i.test(courseName) || /Tch\s*Asst/i.test(courseName)) return null;
  const match = courseName.match(/Period\s*([0-6])/i) || courseName.match(/\bP([0-6])\b/i);
  return match ? parseInt(match[1], 10) : null;
}

async function run() {
  console.log('--- FETCHING FIRESTORE ROSTER ---');
  const rosterSnap = await db.collection('roster').get();
  console.log(`Found ${rosterSnap.size} documents in Firestore 'roster' collection.`);

  const firestoreStudents = [];
  rosterSnap.forEach(doc => {
    const data = doc.data();
    const id = doc.id;
    const studentId = String(data.student_id || id).trim();
    const email = (data.email || data.google_email || `${studentId}@orangeusd.org`).trim().toLowerCase();
    const fullName = data.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Unknown';
    const period = data.class_period !== undefined && data.class_period !== null ? Number(data.class_period) : (data.period !== undefined ? Number(data.period) : null);

    firestoreStudents.push({
      docId: id,
      studentId,
      email,
      fullName,
      period,
      raw: data
    });
  });

  console.log('\n--- FETCHING GOOGLE CLASSROOM ROSTERS ---');
  const coursesRes = await classroom.courses.list({
    courseStates: ['ACTIVE'],
    pageSize: 100
  });
  const courses = coursesRes.data.courses || [];
  console.log(`Found ${courses.length} active Classroom courses.`);

  const classroomStudents = [];
  const coursesByPeriod = {};

  for (const c of courses) {
    const p = extractPeriod(c.name);
    console.log(`Course: "${c.name}" (ID: ${c.id}) -> Period: ${p !== null ? p : 'Ignored/TA'}`);
    if (p === null) continue;
    coursesByPeriod[p] = c;

    let pageToken = null;
    let countForCourse = 0;
    do {
      const sRes = await classroom.courses.students.list({
        courseId: c.id,
        pageSize: 100,
        pageToken
      });
      const students = sRes.data.students || [];
      for (const s of students) {
        countForCourse++;
        const profile = s.profile || {};
        const email = (profile.emailAddress || '').trim().toLowerCase();
        let studentId = '';
        if (email.endsWith('@orangeusd.org')) {
          studentId = email.split('@')[0];
        } else if (email) {
          studentId = email.split('@')[0];
        } else {
          studentId = s.userId;
        }

        classroomStudents.push({
          userId: s.userId,
          studentId,
          email,
          fullName: profile.name?.fullName || 'Unknown',
          period: p,
          courseName: c.name,
          courseId: c.id
        });
      }
      pageToken = sRes.data.nextPageToken;
    } while (pageToken);
    console.log(`  -> Enrolled students in Period ${p}: ${countForCourse}`);
  }

  console.log('\n========================================');
  console.log('SUMMARY COMPARISON');
  console.log('========================================');
  console.log(`Total in Firestore 'roster': ${firestoreStudents.length}`);
  console.log(`Total enrolled across GC periods: ${classroomStudents.length}`);

  // Check for duplicates in Classroom (e.g. enrolled in 2 periods)
  const gcByStudentId = new Map();
  const gcDuplicates = [];
  for (const s of classroomStudents) {
    const key = s.email || s.studentId;
    if (gcByStudentId.has(key)) {
      gcDuplicates.push({ student: s, existing: gcByStudentId.get(key) });
    } else {
      gcByStudentId.set(key, s);
    }
  }
  if (gcDuplicates.length > 0) {
    console.log(`⚠️ Students enrolled in MULTIPLE Google Classroom courses: ${gcDuplicates.length}`);
    for (const d of gcDuplicates) {
      console.log(`   - ${d.student.fullName} (${d.student.studentId}): Period ${d.existing.period} AND Period ${d.student.period}`);
    }
  }

  // Check duplicates in Firestore
  const fsByStudentId = new Map();
  const fsDuplicates = [];
  for (const s of firestoreStudents) {
    const key = s.email || s.studentId;
    if (fsByStudentId.has(key)) {
      fsDuplicates.push({ student: s, existing: fsByStudentId.get(key) });
    } else {
      fsByStudentId.set(key, s);
    }
  }
  if (fsDuplicates.length > 0) {
    console.log(`⚠️ Students DUPLICATED in Firestore: ${fsDuplicates.length}`);
    for (const d of fsDuplicates) {
      console.log(`   - ${d.student.fullName} (${d.student.studentId}): Doc ${d.existing.docId} AND Doc ${d.student.docId}`);
    }
  }

  // Count by Period
  console.log('\n--- BREAKDOWN BY PERIOD ---');
  for (let p = 0; p <= 6; p++) {
    const fsCount = firestoreStudents.filter(s => s.period === p).length;
    const gcCount = classroomStudents.filter(s => s.period === p).length;
    console.log(`Period ${p}: Firestore = ${fsCount} | Google Classroom = ${gcCount} (Diff: ${gcCount - fsCount > 0 ? '+' : ''}${gcCount - fsCount})`);
  }
  const fsUnassigned = firestoreStudents.filter(s => s.period === null || s.period === undefined).length;
  if (fsUnassigned > 0) {
    console.log(`Firestore Unassigned Period: ${fsUnassigned}`);
  }

  // 1. In Firestore, but NOT in Classroom
  console.log('\n--- IN FIRESTORE BUT NOT IN GOOGLE CLASSROOM (Dropped / Transferred?) ---');
  const missingFromGc = firestoreStudents.filter(fs => {
    return !classroomStudents.some(gc => 
      (gc.email && fs.email && gc.email === fs.email) ||
      (gc.studentId && fs.studentId && gc.studentId === fs.studentId)
    );
  });
  console.log(`Count: ${missingFromGc.length}`);
  missingFromGc.forEach((s, idx) => {
    console.log(`${idx + 1}. [P${s.period ?? '?'}] ${s.fullName} | ID: ${s.studentId} | Email: ${s.email}`);
  });

  // 2. In Classroom, but NOT in Firestore
  console.log('\n--- IN GOOGLE CLASSROOM BUT NOT IN FIRESTORE (New Students?) ---');
  const missingFromFs = classroomStudents.filter(gc => {
    return !firestoreStudents.some(fs => 
      (fs.email && gc.email && fs.email === gc.email) ||
      (fs.studentId && gc.studentId && fs.studentId === gc.studentId)
    );
  });
  console.log(`Count: ${missingFromFs.length}`);
  missingFromFs.forEach((s, idx) => {
    console.log(`${idx + 1}. [P${s.period}] ${s.fullName} | ID: ${s.studentId} | Email: ${s.email}`);
  });

  // 3. In both, but Period mismatch
  console.log('\n--- PERIOD MISMATCHES (In both, but assigned to different periods) ---');
  const periodMismatches = [];
  for (const fs of firestoreStudents) {
    const gcMatches = classroomStudents.filter(gc => 
      (gc.email && fs.email && gc.email === fs.email) ||
      (gc.studentId && fs.studentId && gc.studentId === fs.studentId)
    );
    for (const gc of gcMatches) {
      if (fs.period !== gc.period) {
        periodMismatches.push({
          fullName: fs.fullName,
          studentId: fs.studentId,
          email: fs.email,
          firestorePeriod: fs.period,
          classroomPeriod: gc.period
        });
      }
    }
  }
  console.log(`Count: ${periodMismatches.length}`);
  periodMismatches.forEach((m, idx) => {
    console.log(`${idx + 1}. ${m.fullName} (${m.studentId}) -> Firestore: P${m.firestorePeriod ?? '?'} vs Classroom: P${m.classroomPeriod}`);
  });

  console.log('\nDone comparison.');
}

run().catch(err => {
  console.error('Error running comparison:', err);
  process.exit(1);
});
