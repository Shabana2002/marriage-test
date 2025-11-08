// ========================
// GLOBAL VARIABLES
// ========================
let role = '';          // 'female' or 'male'
let code = '';          // unique code for session
let sessionData = {};   // stores answers & submission status

// DOM elements
const startBtn = document.getElementById('takeTest');
const femaleBtn = document.getElementById('femaleBtn');
const maleBtn = document.getElementById('maleBtn');
const submitBtn = document.getElementById('submitBtn');
const downloadBtn = document.getElementById('downloadPDF');
const startOverBtn = document.getElementById('startOver');
const formPage = document.getElementById('formPage');
const guidelinesPage = document.getElementById('guidelines');
const roleSelectPage = document.getElementById('roleSelect');
const formTitle = document.getElementById('formTitle');
const testForm = document.getElementById('testForm');

// ========================
// INIT
// ========================

const urlParams = new URLSearchParams(window.location.search);
code = urlParams.get('code'); // check if accessed via shared link

if (code) {
  // Link access - must be male or female returner
  loadSession(code).then(() => {
    if (sessionData.submittedMale) {
      role = 'female'; // female can now download PDF
      showDownloadButton();
      showMessage('Male has completed the test. You can download the results.');
    } else {
      role = 'male';
      startFormForMale();
    }
  });
} else {
  // Normal flow: female selects gender
  guidelinesPage.classList.remove('hidden');
}

// ========================
// EVENT LISTENERS
// ========================

// Start button
startBtn.addEventListener('click', () => {
  guidelinesPage.classList.add('hidden');
  roleSelectPage.classList.remove('hidden');
});

// Female selection
femaleBtn.addEventListener('click', () => startTest('female'));

// Male selection (only normal male, not link male)
maleBtn.addEventListener('click', () => startTest('male'));

// Submit button
submitBtn.addEventListener('click', e => testForm.dispatchEvent(new Event('submit')));

// Download button
downloadBtn.addEventListener('click', downloadPDF);

// Start over
startOverBtn.addEventListener('click', () => location.reload());

// Warn user if they try to leave mid-test
window.addEventListener('beforeunload', function(e) {
  if (!sessionCompleted()) {
    e.preventDefault();
    e.returnValue = 'You cannot leave the test midway. Are you sure?';
  }
});

// ========================
// FUNCTIONS
// ========================

// Check if session is completed
function sessionCompleted() {
  if (!role) return false;
  if (role === 'female') return sessionData.submittedFemale && sessionData.submittedMale;
  if (role === 'male') return sessionData.submittedMale;
  return false;
}

// Start test
function startTest(selectedRole) {
  role = selectedRole;
  roleSelectPage.classList.add('hidden');
  formPage.classList.remove('hidden');
  formTitle.innerText = role === 'female' ? 'Answer Questions (Female)' : 'Answer Questions (Male)';
  populateForm();
  if(role==='female') femaleBtn.disabled = true;
  if(role==='male') maleBtn.disabled = true;
}

// Populate form questions
function populateForm() {
  testForm.innerHTML = '';
  let questions = [];
  if(role==='female') questions = window.QUESTIONS.sectionA;
  else if(role==='male') questions = window.QUESTIONS.sectionA.concat(window.QUESTIONS.sectionB);

  questions.forEach(q => {
    const div = document.createElement('div');
    div.classList.add('question');
    div.innerHTML = `<p>${q.text}</p>`;
    if (q.options) {
      const type = (q.id==='q6'||q.id==='q9') ? 'checkbox' : 'radio';
      q.options.forEach(opt => {
        div.innerHTML += `<label><input type="${type}" name="${q.id}" value="${opt}"> ${opt}</label><br>`;
      });
    } else if (q.mapping) {
      Object.keys(q.mapping).forEach(k => {
        div.innerHTML += `<label>${k}: <input type="text" name="${q.id}_${k}"></label><br>`;
      });
    }
    testForm.appendChild(div);
  });
}

// Handle form submission
testForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const answers = collectAnswers();

  if(role==='female' && !code) {
    // Female first submission
    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ femaleAnswers: answers })
    });
    const data = await res.json();
    code = data.code;
    sessionData = data;
    sessionData.submittedFemale = true;
    alert(`Share this link with male: ${window.location.origin}/?code=${code}`);
    showMessage('Waiting for male to complete the test...');
    formPage.classList.add('hidden');
  } else if(role==='male') {
    // Male submission
    if(sessionData.submittedMale){
      alert('This link has already been used.');
      return;
    }
    const res = await fetch(`/api/session/${code}/complete`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ maleAnswers: answers })
    });
    const data = await res.json();
    sessionData = data;
    sessionData.submittedMale = true;
    alert('Test completed! PDF download available.');
    showDownloadButton();
  }
});

// ========================
// COLLECT FORM ANSWERS
// ========================
function collectAnswers() {
  const formData = new FormData(testForm);
  const answers = {};
  for (const [key, value] of formData.entries()) {
    if(answers[key]){
      if(Array.isArray(answers[key])) answers[key].push(value);
      else answers[key] = [answers[key], value];
    } else {
      answers[key] = value;
    }
  }
  return answers;
}

// ========================
// LOAD SESSION
// ========================
async function loadSession(sessionCode) {
  const res = await fetch(`/api/session/${sessionCode}`);
  const data = await res.json();
  if(!data.femaleAnswers) {
    alert('Female has not completed the test yet.');
    location.href = '/';
  }
  sessionData = data;
}

// ========================
// SHOW FORM FOR LINKED MALE
// ========================
function startFormForMale() {
  roleSelectPage.classList.add('hidden');
  formPage.classList.remove('hidden');
  formTitle.innerText = 'Answer Questions (Male)';
  populateForm();
}

// ========================
// DOWNLOAD PDF
// ========================
function showDownloadButton() {
  downloadBtn.classList.remove('hidden');
}

// ========================
async function downloadPDF() {
  if(!sessionData.submittedMale){
    alert('PDF is not available until male completes the test.');
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 10;
  doc.text('Section A — Compatibility', 10, y);
  y += 10;
  window.QUESTIONS.sectionA.forEach(q => {
    const fAns = Array.isArray(sessionData.femaleAnswers[q.id]) ? sessionData.femaleAnswers[q.id].join(', ') : sessionData.femaleAnswers[q.id];
    const mAns = Array.isArray(sessionData.maleAnswers[q.id]) ? sessionData.maleAnswers[q.id].join(', ') : sessionData.maleAnswers[q.id];
    doc.text(`${q.text}`, 10, y); y += 5;
    doc.text(`Female: ${fAns}`, 10, y);
    doc.text(`Male: ${mAns}`, 100, y);
    y += 10;
  });

  // Section B — Male only
  doc.text('Section B — Male Emotional Awareness', 10, y); y += 10;
  const maleScore = window.SCORING.scoreSectionB(sessionData.maleAnswers);
  doc.text(`Male Score: ${maleScore.percent}%`, 10, y);

  doc.save('MarriageTestResult.pdf');
}

// ========================
// UTILITIES
// ========================
function showMessage(msg) {
  const msgDiv = document.getElementById('message');
  if(msgDiv){
    msgDiv.innerText = msg;
    msgDiv.classList.remove('hidden');
  }
}
