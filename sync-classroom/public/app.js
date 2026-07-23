// --------------------------------------------------------------------------
// Mudry Gradebook Sync - Client Logic
// --------------------------------------------------------------------------

// DOM Elements
const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');
const loginForm = document.getElementById('login-form');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('login-error');

const btnLogout = document.getElementById('btn-logout');
const coursesList = document.getElementById('courses-list');
const assignmentSelect = document.getElementById('assignment-select');
const syncAssignmentTitle = document.getElementById('sync-assignment-title');
const btnSyncAll = document.getElementById('btn-sync-all');
const studentsTbody = document.getElementById('students-tbody');

const createAssignmentForm = document.getElementById('create-assignment-form');
const assignmentTitle = document.getElementById('assignment-title');
const assignmentDescription = document.getElementById('assignment-description');
const assignmentMaxPoints = document.getElementById('assignment-max-points');

const logsContainer = document.getElementById('logs-container');
const btnClearLogs = document.getElementById('btn-clear-logs');

// App State
let activeCourses = [];
let activeStudents = [];
let selectedAssignmentId = '';

// ---------------------------------------------------------
// 1. Logger Utility
// ---------------------------------------------------------
function log(message, type = 'info') {
  const line = document.createElement('div');
  line.className = `log-line ${type}`;
  const timestamp = new Date().toLocaleTimeString();
  line.innerText = `[${timestamp}] ${message}`;
  logsContainer.appendChild(line);
  logsContainer.scrollTop = logsContainer.scrollHeight;
}

// ---------------------------------------------------------
// 2. Authentication Flow
// ---------------------------------------------------------
async function checkAuth() {
  try {
    const res = await fetch('/api/auth/verify');
    const data = await res.json();
    if (data.authenticated) {
      showDashboard();
    } else {
      showLogin();
    }
  } catch (err) {
    log('Failed checking session authentication status', 'error');
    showLogin();
  }
}

function showLogin() {
  loginContainer.classList.add('active');
  dashboardContainer.classList.remove('active');
}

function showDashboard() {
  loginContainer.classList.remove('active');
  dashboardContainer.classList.add('active');
  log('Secure connection validated. Portal unlocked.', 'system');
  initializeDashboard();
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = passwordInput.value;
  loginError.innerText = '';
  
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    
    if (res.ok) {
      passwordInput.value = '';
      showDashboard();
    } else {
      const data = await res.json();
      loginError.innerText = data.error || 'Invalid credentials';
    }
  } catch (err) {
    loginError.innerText = 'Server authentication request timed out.';
  }
});

btnLogout.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  log('Portal session ended.', 'system');
  showLogin();
});

// ---------------------------------------------------------
// 3. Dashboard Initialization
// ---------------------------------------------------------
function initializeDashboard() {
  fetchCourses();
  fetchAssignments();
}

async function fetchCourses() {
  try {
    const res = await fetch('/api/courses');
    if (!res.ok) throw new Error();
    const courses = await res.json();
    
    coursesList.innerHTML = '';
    if (courses.length === 0) {
      coursesList.innerHTML = '<p class="loading-text">No active courses found.</p>';
      return;
    }
    
    courses.forEach(course => {
      const div = document.createElement('div');
      div.className = 'course-checkbox-item';
      div.innerHTML = `
        <input type="checkbox" id="course-${course.id}" value="${course.id}" class="course-selector-cb">
        <label for="course-${course.id}">
          <div class="course-name">${course.name}</div>
          <div class="section-desc">${course.section || 'No Section'}</div>
        </label>
      `;
      coursesList.appendChild(div);
    });
    
    log(`Retrieved ${courses.length} active Classroom courses.`, 'success');
  } catch (err) {
    coursesList.innerHTML = '<p class="error-msg">Failed to load courses.</p>';
    log('Failed to fetch courses from Classroom API.', 'error');
  }
}

async function fetchAssignments() {
  try {
    const res = await fetch('/api/assignments');
    const assignments = await res.json();
    
    // Clear other options except the placeholder
    assignmentSelect.innerHTML = '<option value="">Choose assignment...</option>';
    
    assignments.forEach(assignment => {
      const opt = document.createElement('option');
      opt.value = assignment.id;
      opt.innerText = assignment.name;
      assignmentSelect.appendChild(opt);
    });
    
    log(`Retrieved ${assignments.length} assignments from Firestore.`, 'success');
  } catch (err) {
    log('Failed to retrieve Firestore assignments.', 'error');
  }
}

// ---------------------------------------------------------
// 4. Student Scores Loader
// ---------------------------------------------------------
assignmentSelect.addEventListener('change', async (e) => {
  selectedAssignmentId = e.target.value;
  if (!selectedAssignmentId) {
    syncAssignmentTitle.innerText = 'No assignment selected.';
    btnSyncAll.disabled = true;
    studentsTbody.innerHTML = '<tr><td colspan="5" class="empty-state">Select a Firestore assignment to view student scores.</td></tr>';
    return;
  }
  
  syncAssignmentTitle.innerText = `Current Sync Target: ${selectedAssignmentId}`;
  studentsTbody.innerHTML = '<tr><td colspan="5" class="empty-state">Fetching student scores...</td></tr>';
  
  try {
    const res = await fetch(`/api/assignments/${selectedAssignmentId}/scores`);
    activeStudents = await res.json();
    
    renderStudentsTable();
    btnSyncAll.disabled = activeStudents.length === 0;
    log(`Fetched ${activeStudents.length} student scores for "${selectedAssignmentId}".`, 'success');
  } catch (err) {
    studentsTbody.innerHTML = '<tr><td colspan="5" class="error-msg">Failed to retrieve scores.</td></tr>';
    log(`Failed to fetch scores for assignment "${selectedAssignmentId}".`, 'error');
  }
});

function renderStudentsTable() {
  studentsTbody.innerHTML = '';
  if (activeStudents.length === 0) {
    studentsTbody.innerHTML = '<tr><td colspan="5" class="empty-state">No students found with scores for this assignment.</td></tr>';
    return;
  }
  
  activeStudents.forEach(student => {
    const tr = document.createElement('tr');
    tr.id = `student-row-${student.student_id}`;
    tr.innerHTML = `
      <td class="student-id-cell">${student.student_id}</td>
      <td>${student.name}</td>
      <td>Period ${student.class_period}</td>
      <td><span class="grade-badge">${student.score}</span></td>
      <td>
        <button class="btn-secondary btn-sync-single" onclick="syncSingleGrade('${student.student_id}', ${student.score})">Sync Score</button>
      </td>
    `;
    studentsTbody.appendChild(tr);
  });
}

// ---------------------------------------------------------
// 5. Assignment Creation (Deployment)
// ---------------------------------------------------------
createAssignmentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Get checked courses
  const checkedBoxes = document.querySelectorAll('.course-selector-cb:checked');
  const courseIds = Array.from(checkedBoxes).map(cb => cb.value);
  
  if (courseIds.length === 0) {
    alert('Please select at least one Google Classroom course in the Control Center first.');
    return;
  }
  
  const title = assignmentTitle.value;
  const description = assignmentDescription.value;
  const maxPoints = parseInt(assignmentMaxPoints.value);
  
  log(`Deploying assignment "${title}" to ${courseIds.length} course(s)...`, 'info');
  
  try {
    const res = await fetch('/api/create-assignment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseIds, title, description, maxPoints })
    });
    const data = await res.json();
    
    if (data.results) {
      data.results.forEach(res => {
        if (res.success) {
          log(`Successfully created assignment in Course [${res.courseId}]. Coursework ID: ${res.courseworkId}`, 'success');
        } else {
          log(`Failed to create assignment in Course [${res.courseId}]: ${res.error}`, 'error');
        }
      });
      alert('Assignment deployment complete. View logs below for coursework IDs.');
      createAssignmentForm.reset();
      assignmentMaxPoints.value = 10;
    }
  } catch (err) {
    log('Failed assignment deployment API call.', 'error');
  }
});

// ---------------------------------------------------------
// 6. Grades Synchronization Operations
// ---------------------------------------------------------

// Helper: Auto-resolves Coursework ID by querying Google Classroom coursework and matching assignment titles
async function resolveCourseworkId(courseId, targetAssignmentName) {
  try {
    log(`Querying Google Classroom coursework for course [${courseId}]...`, 'info');
    const res = await fetch(`/api/courses/${courseId}/coursework`);
    if (!res.ok) return null;
    const courseworkList = await res.json();
    if (!courseworkList || courseworkList.length === 0) {
      log(`No coursework assignments found in Classroom course [${courseId}].`, 'error');
      return null;
    }

    // 1. Try exact title match
    const normTarget = (targetAssignmentName || selectedAssignmentId).toLowerCase().trim();
    const match = courseworkList.find(cw => cw.title && cw.title.toLowerCase().trim() === normTarget);
    if (match) {
      log(`Auto-matched Google Classroom coursework: "${match.title}" (ID: ${match.id})`, 'success');
      return match.id;
    }

    // 2. Try partial title match
    const partialMatch = courseworkList.find(cw => cw.title && (cw.title.toLowerCase().includes(normTarget) || normTarget.includes(cw.title.toLowerCase())));
    if (partialMatch) {
      log(`Auto-matched Google Classroom coursework: "${partialMatch.title}" (ID: ${partialMatch.id})`, 'success');
      return partialMatch.id;
    }

    // 3. Fallback: If only 1 coursework assignment exists in the course, auto-select it
    if (courseworkList.length === 1) {
      log(`Auto-selected coursework: "${courseworkList[0].title}" (ID: ${courseworkList[0].id})`, 'info');
      return courseworkList[0].id;
    }

    // 4. Prompt with assignment title choices if multiple options exist
    const optionsText = courseworkList.map((cw, idx) => `${idx + 1}. ${cw.title} (ID: ${cw.id})`).join('\n');
    const choice = prompt(`Select Google Classroom Assignment for Course:\n\n${optionsText}\n\nEnter number (1-${courseworkList.length}) or enter Coursework ID:`);
    if (!choice) return null;

    const num = parseInt(choice.trim());
    if (!isNaN(num) && num >= 1 && num <= courseworkList.length) {
      return courseworkList[num - 1].id;
    }
    return choice.trim();
  } catch (err) {
    console.error("Error resolving coursework ID:", err);
    return null;
  }
}

async function syncSingleGrade(studentId, score) {
  const checkedBoxes = document.querySelectorAll('.course-selector-cb:checked');
  if (checkedBoxes.length === 0) {
    alert('Please select the target Google Classroom Course in the Control Center first.');
    return;
  }
  
  const courseId = checkedBoxes[0].value;
  const courseworkId = await resolveCourseworkId(courseId, selectedAssignmentId);
  
  if (!courseworkId) {
    alert('Could not resolve Google Classroom Coursework ID.');
    return;
  }
  
  log(`Initiating grade sync for Student [${studentId}]...`, 'info');
  
  try {
    const res = await fetch('/api/sync-grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, courseworkId, studentId, score })
    });
    
    if (res.ok) {
      const data = await res.json();
      log(`Success: Synced score ${score} for Student [${studentId}]. Submission ID: ${data.submissionId}`, 'success');
      
      const row = document.getElementById(`student-row-${studentId}`);
      if (row) {
        row.style.opacity = '0.5';
        const button = row.querySelector('.btn-sync-single');
        button.innerText = 'Synced & Returned';
        button.disabled = true;
      }
    } else {
      const data = await res.json();
      log(`Failed sync for Student [${studentId}]: ${data.error}`, 'error');
    }
  } catch (err) {
    log(`Network error syncing Student [${studentId}].`, 'error');
  }
}

btnSyncAll.addEventListener('click', async () => {
  const checkedBoxes = document.querySelectorAll('.course-selector-cb:checked');
  if (checkedBoxes.length === 0) {
    alert('Please select a target Google Classroom Course in the Control Center first.');
    return;
  }
  
  const courseId = checkedBoxes[0].value;
  const courseworkId = await resolveCourseworkId(courseId, selectedAssignmentId);
  
  if (!courseworkId) {
    alert('Could not resolve Google Classroom Coursework ID.');
    return;
  }
  
  if (!confirm(`Are you sure you want to sync all ${activeStudents.length} grades to Coursework [${courseworkId}]?`)) return;
  
  btnSyncAll.disabled = true;
  log(`Starting batch grade sync for ${activeStudents.length} students...`, 'info');
  
  for (const student of activeStudents) {
    try {
      const res = await fetch('/api/sync-grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, courseworkId, studentId: student.student_id, score: student.score })
      });
      
      if (res.ok) {
        log(`Success: Synced ${student.name} (${student.student_id}) -> Grade: ${student.score}`, 'success');
        const row = document.getElementById(`student-row-${student.student_id}`);
        if (row) {
          row.style.opacity = '0.5';
          const button = row.querySelector('.btn-sync-single');
          button.innerText = 'Synced';
          button.disabled = true;
        }
      } else {
        const data = await res.json();
        log(`Failed: ${student.name} (${student.student_id}) -> ${data.error}`, 'error');
      }
    } catch (err) {
      log(`Network error syncing ${student.name}`, 'error');
    }
  }
  
  log('Batch synchronization process finished.', 'system');
  btnSyncAll.disabled = false;
});

// Logs cleaner
btnClearLogs.addEventListener('click', () => {
  logsContainer.innerHTML = '';
  log('Logs cleared. Terminal active.', 'system');
});

// Start checking session on page load
checkAuth();
