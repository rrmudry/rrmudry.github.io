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
const btnRefreshAll = document.getElementById('btn-refresh-all');
const coursesList = document.getElementById('courses-list');
const classroomCourseworkSelect = document.getElementById('classroom-coursework-select');
const assignmentSelect = document.getElementById('assignment-select');
const syncAssignmentTitle = document.getElementById('sync-assignment-title');
const periodFilterSelect = document.getElementById('period-filter-select');
const filterStats = document.getElementById('filter-stats');
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
let activeCoursework = [];
let activeAssignments = [];
let activeStudents = [];
let displayedStudents = [];
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

if (btnRefreshAll) {
  btnRefreshAll.addEventListener('click', () => {
    log('Refreshing all courses, coursework, and Firestore activities...', 'info');
    initializeDashboard();
  });
}

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
    activeCourses = await res.json();
    
    coursesList.innerHTML = '';
    if (activeCourses.length === 0) {
      coursesList.innerHTML = '<p class="loading-text">No active courses found.</p>';
      return;
    }
    
    activeCourses.forEach(course => {
      const div = document.createElement('div');
      div.className = 'course-checkbox-item';
      const periodLabel = course.inferredPeriod ? ` (Period ${course.inferredPeriod})` : '';
      div.innerHTML = `
        <input type="checkbox" id="course-${course.id}" value="${course.id}" data-period="${course.inferredPeriod || ''}" class="course-selector-cb" onchange="onCourseSelectionChanged()">
        <label for="course-${course.id}">
          <div class="course-name">${course.name}${periodLabel}</div>
          <div class="section-desc">${course.section || 'No Section'}</div>
        </label>
      `;
      coursesList.appendChild(div);
    });
    
    log(`Retrieved ${activeCourses.length} active Classroom courses.`, 'success');
  } catch (err) {
    coursesList.innerHTML = '<p class="error-msg">Failed to load courses.</p>';
    log('Failed to fetch courses from Classroom API.', 'error');
  }
}

async function onCourseSelectionChanged() {
  const checkedBoxes = document.querySelectorAll('.course-selector-cb:checked');
  if (checkedBoxes.length === 0) {
    if (classroomCourseworkSelect) {
      classroomCourseworkSelect.innerHTML = '<option value="">Select course above first...</option>';
    }
    return;
  }

  const selectedCb = checkedBoxes[0];
  const courseId = selectedCb.value;
  const inferredPeriod = selectedCb.dataset.period;

  // Auto-set the period filter if course has an inferred period
  if (inferredPeriod && periodFilterSelect) {
    periodFilterSelect.value = String(inferredPeriod);
    renderStudentsTable();
    log(`⚡ Auto-filtered score list to Period ${inferredPeriod} to match selected course.`, 'info');
  }

  await fetchClassroomCoursework(courseId);
}

async function fetchClassroomCoursework(courseId) {
  if (!classroomCourseworkSelect) return;
  classroomCourseworkSelect.innerHTML = '<option value="">Loading coursework from Classroom...</option>';
  
  try {
    const res = await fetch(`/api/courses/${courseId}/coursework`);
    if (!res.ok) throw new Error();
    activeCoursework = await res.json();

    classroomCourseworkSelect.innerHTML = '<option value="">Select Classroom Assignment...</option>';
    if (activeCoursework.length === 0) {
      classroomCourseworkSelect.innerHTML = '<option value="">No coursework found in this course</option>';
      return;
    }

    activeCoursework.forEach(cw => {
      const opt = document.createElement('option');
      opt.value = cw.id;
      opt.innerText = `${cw.title}${cw.maxPoints ? ` (${cw.maxPoints} pts)` : ''}`;
      opt.dataset.title = cw.title;
      classroomCourseworkSelect.appendChild(opt);
    });

    log(`Retrieved ${activeCoursework.length} assignments from Google Classroom course [${courseId}].`, 'info');

    // Auto-match if an assignment is already selected in Firestore
    attemptAutoMatch();
  } catch (err) {
    classroomCourseworkSelect.innerHTML = '<option value="">Failed to load coursework</option>';
    log(`Could not load coursework for course [${courseId}].`, 'error');
  }
}

async function fetchAssignments() {
  try {
    const res = await fetch('/api/assignments');
    activeAssignments = await res.json();
    
    // Clear other options except the placeholder
    assignmentSelect.innerHTML = '<option value="">Choose activity...</option>';
    
    activeAssignments.forEach(assignment => {
      const opt = document.createElement('option');
      opt.value = assignment.id;
      opt.innerText = assignment.name;
      opt.dataset.rawName = assignment.rawName || assignment.id;
      assignmentSelect.appendChild(opt);
    });
    
    log(`Retrieved ${activeAssignments.length} activities from Firestore.`, 'success');

    attemptAutoMatch();
  } catch (err) {
    log('Failed to retrieve Firestore assignments.', 'error');
  }
}

function normalizeTitle(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[_\-]/g, ' ')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function attemptAutoMatch() {
  if (!classroomCourseworkSelect || !assignmentSelect) return;

  const currentCwId = classroomCourseworkSelect.value;
  const currentAssId = assignmentSelect.value;

  // Case 1: Coursework is selected, try matching Firestore assignment
  if (currentCwId && !currentAssId && activeCoursework.length > 0) {
    const selectedCw = activeCoursework.find(c => c.id === currentCwId);
    if (selectedCw) {
      const normCw = normalizeTitle(selectedCw.title);
      const match = activeAssignments.find(a => {
        const normAss = normalizeTitle(a.rawName || a.id);
        return normAss === normCw || normAss.includes(normCw) || normCw.includes(normAss);
      });
      if (match) {
        assignmentSelect.value = match.id;
        assignmentSelect.dispatchEvent(new Event('change'));
        log(`🎯 Auto-matched Firestore activity: "${match.name}"`, 'success');
      }
    }
  }

  // Case 2: Firestore assignment is selected, try matching Classroom coursework
  if (currentAssId && !currentCwId && activeCoursework.length > 0) {
    const selectedAss = activeAssignments.find(a => a.id === currentAssId);
    if (selectedAss) {
      const normAss = normalizeTitle(selectedAss.rawName || selectedAss.id);
      const match = activeCoursework.find(c => {
        const normCw = normalizeTitle(c.title);
        return normCw === normAss || normCw.includes(normAss) || normAss.includes(normCw);
      });
      if (match) {
        classroomCourseworkSelect.value = match.id;
        log(`🎯 Auto-matched Google Classroom assignment: "${match.title}"`, 'success');
      }
    }
  }
}

if (classroomCourseworkSelect) {
  classroomCourseworkSelect.addEventListener('change', () => {
    attemptAutoMatch();
  });
}

if (periodFilterSelect) {
  periodFilterSelect.addEventListener('change', () => {
    renderStudentsTable();
  });
}

// ---------------------------------------------------------
// 4. Student Scores Loader & Filter
// ---------------------------------------------------------
assignmentSelect.addEventListener('change', async (e) => {
  selectedAssignmentId = e.target.value;
  if (!selectedAssignmentId) {
    syncAssignmentTitle.innerText = 'No assignment selected.';
    btnSyncAll.disabled = true;
    studentsTbody.innerHTML = '<tr><td colspan="5" class="empty-state">Select a Firestore assignment to view student scores.</td></tr>';
    if (filterStats) filterStats.innerText = 'No assignment selected';
    return;
  }
  
  attemptAutoMatch();

  const selectedItem = activeAssignments.find(a => a.id === selectedAssignmentId);
  const displayTitle = selectedItem ? selectedItem.name : selectedAssignmentId;

  syncAssignmentTitle.innerText = `Current Sync Target: ${displayTitle}`;
  studentsTbody.innerHTML = '<tr><td colspan="5" class="empty-state">Fetching student scores...</td></tr>';
  
  try {
    const res = await fetch(`/api/assignments/${encodeURIComponent(selectedAssignmentId)}/scores`);
    activeStudents = await res.json();
    
    renderStudentsTable();
    log(`Fetched ${activeStudents.length} total student scores for "${displayTitle}".`, 'success');
  } catch (err) {
    studentsTbody.innerHTML = '<tr><td colspan="5" class="error-msg">Failed to retrieve scores.</td></tr>';
    log(`Failed to fetch scores for assignment "${selectedAssignmentId}".`, 'error');
  }
});

function renderStudentsTable() {
  studentsTbody.innerHTML = '';
  
  const selectedFilter = periodFilterSelect ? periodFilterSelect.value : 'ALL';
  if (selectedFilter === 'ALL') {
    displayedStudents = [...activeStudents];
  } else {
    displayedStudents = activeStudents.filter(s => String(s.class_period) === String(selectedFilter));
  }

  if (filterStats) {
    if (selectedFilter === 'ALL') {
      filterStats.innerText = `Showing all ${activeStudents.length} students`;
    } else {
      filterStats.innerText = `Showing ${displayedStudents.length} students in Period ${selectedFilter} (${activeStudents.length} total)`;
    }
  }

  if (btnSyncAll) {
    btnSyncAll.disabled = displayedStudents.length === 0;
    if (selectedFilter === 'ALL') {
      btnSyncAll.innerText = `🚀 Sync All ${displayedStudents.length} Scores`;
    } else {
      btnSyncAll.innerText = `🚀 Sync Period ${selectedFilter} (${displayedStudents.length} Scores)`;
    }
  }

  if (displayedStudents.length === 0) {
    studentsTbody.innerHTML = `<tr><td colspan="5" class="empty-state">No students found with scores for ${selectedFilter === 'ALL' ? 'this assignment' : 'Period ' + selectedFilter}.</td></tr>`;
    return;
  }
  
  displayedStudents.forEach(student => {
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
      assignmentMaxPoints.value = 100;
      if (courseIds.length > 0) {
        fetchClassroomCoursework(courseIds[0]);
      }
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
  // 1. If teacher already picked a coursework from the dropdown, use it directly!
  if (classroomCourseworkSelect && classroomCourseworkSelect.value) {
    return classroomCourseworkSelect.value;
  }

  try {
    const targetName = targetAssignmentName || selectedAssignmentId;
    log(`Querying Google Classroom coursework for course [${courseId}]...`, 'info');
    
    const res = await fetch(`/api/courses/${courseId}/coursework`);
    let courseworkList = [];
    if (res.ok) {
      courseworkList = await res.json();
    }

    const normTarget = normalizeTitle(targetName);

    if (Array.isArray(courseworkList) && courseworkList.length > 0) {
      // 1. Try exact title match
      const match = courseworkList.find(cw => normalizeTitle(cw.title) === normTarget);
      if (match) {
        log(`Auto-matched Google Classroom coursework: "${match.title}" (ID: ${match.id})`, 'success');
        return match.id;
      }

      // 2. Try partial title match
      const partialMatch = courseworkList.find(cw => {
        const normCw = normalizeTitle(cw.title);
        return normCw.includes(normTarget) || normTarget.includes(normCw);
      });
      if (partialMatch) {
        log(`Auto-matched Google Classroom coursework: "${partialMatch.title}" (ID: ${partialMatch.id})`, 'success');
        return partialMatch.id;
      }

      // 3. Display list of published Google Classroom assignments to pick from
      const optionsText = courseworkList.map((cw, idx) => `${idx + 1}. ${cw.title}`).join('\n');
      const choice = prompt(`No exact title match for "${targetName}" in Google Classroom.\nSelect an assignment to sync to:\n\n${optionsText}\n\nEnter number (1-${courseworkList.length}) or enter Coursework ID:`);
      if (choice) {
        const num = parseInt(choice.trim());
        if (!isNaN(num) && num >= 1 && num <= courseworkList.length) {
          return courseworkList[num - 1].id;
        }
        return choice.trim();
      }
    }

    // 4. Fallback if no coursework exists in course or user entered custom value
    const fallback = prompt(`Enter or paste the Google Classroom Coursework ID for assignment "${targetName}":`);
    return fallback ? fallback.trim() : null;
  } catch (err) {
    console.error("Error resolving coursework ID:", err);
    return null;
  }
}

// Helper: Format error messages with actionable advice
function formatSyncError(errorMsg) {
  if (typeof errorMsg === 'string' && errorMsg.includes('@ProjectPermissionDenied')) {
    return 'Permission Denied: This assignment was created manually on classroom.google.com. Google Classroom API requires assignments to be created via the "Deploy Classroom Coursework" tool above so your Google Cloud project is authorized to sync & return grades.';
  }
  return errorMsg;
}

const btnAutofillDeploy = document.getElementById('btn-autofill-deploy');
if (btnAutofillDeploy) {
  btnAutofillDeploy.addEventListener('click', () => {
    if (!selectedAssignmentId) {
      alert('Please select a Source Firestore Activity from the dropdown above first.');
      return;
    }
    const selectedItem = activeAssignments.find(a => a.id === selectedAssignmentId);
    const title = selectedItem ? (selectedItem.rawName || selectedItem.id) : selectedAssignmentId;
    if (assignmentTitle) assignmentTitle.value = title;
    if (assignmentMaxPoints) assignmentMaxPoints.value = 100;
    if (assignmentDescription) {
      assignmentDescription.value = `Please complete the ${title} interactive web activity at: https://rrmudry.github.io/unit-conversion-practice/`;
    }
    log(`📋 Copied "${title}" to the Deploy Classroom Coursework form. Check your courses and click "Deploy to Selected Courses"!`, 'info');
    if (assignmentTitle) assignmentTitle.focus();
  });
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
  
  log(`Initiating grade sync for Student [${studentId}] (Score: ${score})...`, 'info');
  
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
      log(`Failed sync for Student [${studentId}]: ${formatSyncError(data.error)}`, 'error');
    }
  } catch (err) {
    log(`Network error syncing Student [${studentId}].`, 'error');
  }
}

// Fast concurrent batch processor
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

  const targetsToSync = displayedStudents.length > 0 ? displayedStudents : activeStudents;
  const selectedFilter = periodFilterSelect ? periodFilterSelect.value : 'ALL';
  const periodDesc = selectedFilter === 'ALL' ? 'all periods' : `Period ${selectedFilter}`;

  if (!confirm(`Are you sure you want to sync ${targetsToSync.length} grades (${periodDesc}) to Coursework [${courseworkId}]?`)) return;
  
  btnSyncAll.disabled = true;
  log(`⚡ Starting high-speed batch grade sync for ${targetsToSync.length} students (${periodDesc})...`, 'info');
  
  let successCount = 0;
  let failCount = 0;
  let permissionDeniedEncountered = false;

  // Process in concurrent pools of 4 parallel requests for maximum speed
  const CONCURRENCY = 4;
  for (let i = 0; i < targetsToSync.length; i += CONCURRENCY) {
    const chunk = targetsToSync.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(async (student) => {
      try {
        const res = await fetch('/api/sync-grade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId, courseworkId, studentId: student.student_id, score: student.score })
        });
        
        if (res.ok) {
          successCount++;
          log(`✅ Synced: ${student.name} (${student.student_id}) -> Grade: ${student.score}`, 'success');
          const row = document.getElementById(`student-row-${student.student_id}`);
          if (row) {
            row.style.opacity = '0.5';
            const button = row.querySelector('.btn-sync-single');
            if (button) {
              button.innerText = 'Synced';
              button.disabled = true;
            }
          }
        } else {
          failCount++;
          const data = await res.json();
          const formattedErr = formatSyncError(data.error);
          log(`❌ Failed: ${student.name} (${student.student_id}) -> ${formattedErr}`, 'error');
          if (typeof data.error === 'string' && data.error.includes('@ProjectPermissionDenied')) {
            permissionDeniedEncountered = true;
          }
        }
      } catch (err) {
        failCount++;
        log(`Network error syncing ${student.name}`, 'error');
      }
    }));
  }
  
  log(`🏁 Batch synchronization complete. Synced: ${successCount}, Failed: ${failCount}`, 'system');
  if (permissionDeniedEncountered) {
    log(`💡 SOLUTION: Deploy this assignment using the "Deploy Classroom Coursework" form above, then sync grades to that deployed assignment!`, 'info');
  }
  btnSyncAll.disabled = false;
});

// Logs cleaner
btnClearLogs.addEventListener('click', () => {
  logsContainer.innerHTML = '';
  log('Logs cleared. Terminal active.', 'system');
});

// Start checking session on page load
checkAuth();
