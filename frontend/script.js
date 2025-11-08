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
const downloadBtn = document.getElementById('downloadPDF');
const startOverBtn = document.getElementById('startOver');
const formPage = document.getElementById('formPage');
const guidelinesPage = document.getElementById('guidelines');
const roleSelectPage = document.getElementById('roleSelect');
const formTitle = document.getElementById('formTitle');
const testForm = document.getElementById('testForm');
const messageDiv = document.getElementById('message');

// ========================
// INIT
// ========================
const urlParams = new URLSearchParams(window.location.search);
code = urlParams.get('code');

if (code) {
  // Male accessing link or female revisiting PDF
  loadSession(code).then(() => {
    if (sessionData.submittedMale) {
      // Male has already completed → female can download
      role = 'female';
      showDownloadButton();
      showMessage('Male has completed the test. You can download the results.');
    } else {
      // Male accesses the link to complete test
      role = 'male';
      startFormForMale();
    }
  });
} else {
  guidelinesPage.classList.remove('hidden');
}

// ========================
// EVENT LISTENERS
// ========================
startBtn.addEventListener('click', () => {
  guidelinesPage.classList.add('hidden');
  roleSelectPage.classList.remove('hidden');
});

femaleBtn.addEventListener('click', () => startTest('female'));
maleBtn.addEventListener('click', () => startTest('male'));

testForm.addEventListener('submit', handleSubmit);
downloadBtn.addEventListener('click', downloadPDF);
startOverBtn.addEventListener('click', () => location.reload());

window.addEventListener('beforeunload', function(e) {
  if (!sessionCompleted()) {
    e.preventDefault();
    e.returnValue = 'You cannot leave the test midway. Are you sure?';
  }
});

// ========================
// FUNCTIONS
// ========================

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
  let questions = role === 'female' ? window.QUESTIONS.sectionA : window.QUESTIONS.sectionA.concat(window.QUESTIONS.sectionB);

  questions.forEach(q => {
    const div = document.createElement('div');
    div.classList.add('question');
    div.innerHTML = `<p>${q.text}</p>`;

    if (q.options) {
      const type = (q.id==='q6'||q.id==='q9') ? 'checkbox' : 'radio';
      q.options.forEach(opt => {
        const inputId = `${q.id}_${opt}`;
        div.innerHTML += `<label for="${inputId}"><input id="${inputId}" type="${type}" name="${q.id}" value="${opt}"> ${opt}</label><br>`;
      });
    } else if (q.mapping) {
      Object.keys(q.mapping).forEach(k => {
        const label = document.createElement('label');
        label.innerText = k + ': ';
        const select = document.createElement('select');
        select.name = `${q.id}_${k}`;
        q.mapping[k].forEach(opt => {
          const optionEl = document.createElement('option');
          optionEl.value = opt;
          optionEl.innerText = opt;
          select.appendChild(optionEl);
        });
        label.appendChild(select);
        div.appendChild(label);
        div.appendChild(document.createElement('br'));
      });
    }

    testForm.appendChild(div);
  });
}

// Collect answers
function collectAnswers() {
  const answers = {};
  const elements = testForm.querySelectorAll('input, select');

  elements.forEach(el => {
    if(el.type === 'checkbox') {
      if(!answers[el.name]) answers[el.name] = [];
      if(el.checked) answers[el.name].push(el.value);
    } else if(el.type === 'radio') {
      if(el.checked) answers[el.name] = el.value;
    } else if(el.tagName.toLowerCase() === 'select') {
      answers[el.name] = el.value;
    }
  });

  return answers;
}

// Handle form submission
async function handleSubmit(e) {
  e.preventDefault();
  const answers = collectAnswers();

  try {
    if(role==='female' && !code) {
      // Female submits → get code
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ femaleAnswers: answers })
      });
      if(!res.ok) throw new Error("Network error");
      const data = await res.json();
      code = data.code;
      sessionData = data;
      sessionData.submittedFemale = true;

      // Show link for sharing
      formPage.classList.add('hidden');
      showMessage(`Share this link with male: ${window.location.origin}/?code=${code}`);
    } else if(role==='male') {
      if(sessionData.submittedMale){
        alert('This link has already been used.');
        return;
      }
      // Male submits → complete test
      const res = await fetch(`/api/session/${code}/complete`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ maleAnswers: answers })
      });
      if(!res.ok) throw new Error("Network error");
      const data = await res.json();
      sessionData = data;
      sessionData.submittedMale = true;
      alert('Test completed! PDF download available.');
      showDownloadButton();
      formPage.classList.add('hidden');
    }
  } catch(err) {
    alert("Submission failed: " + err.message);
  }
}

// ========================
// Session helpers
// ========================
function sessionCompleted() {
  if (!role) return false;
  if (role === 'female') return sessionData.submittedFemale && sessionData.submittedMale;
  if (role === 'male') return sessionData.submittedMale;
  return false;
}

async function loadSession(sessionCode) {
  const res = await fetch(`/api/session/${sessionCode}`);
  const data = await res.json();
  if(!data.femaleAnswers){
    alert('Female has not completed the test yet.');
    location.href = '/';
  }
  sessionData = data;
}

function startFormForMale() {
  formPage.classList.remove('hidden');
  formTitle.innerText = 'Answer Questions (Male)';
  populateForm();
}

function showDownloadButton() {
  downloadBtn.classList.remove('hidden');
}

async function downloadPDF() {
  if(!sessionData.submittedMale){
    alert('PDF is not available until male completes the test.');
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 10;
  doc.text('Section A — Compatibility', 10, y); y += 10;
  window.QUESTIONS.sectionA.forEach(q => {
    const fAns = Array.isArray(sessionData.femaleAnswers[q.id]) ? sessionData.femaleAnswers[q.id].join(', ') : sessionData.femaleAnswers[q.id];
    const mAns = Array.isArray(sessionData.maleAnswers[q.id]) ? sessionData.maleAnswers[q.id].join(', ') : sessionData.maleAnswers[q.id];
    doc.text(`${q.text}`, 10, y); y += 5;
    doc.text(`Female: ${fAns}`, 10, y);
    doc.text(`Male: ${mAns}`, 100, y);
    y += 10;
  });

  doc.text('Section B — Male Only', 10, y); y += 10;
  const maleScore = window.SCORING.scoreSectionB(sessionData.maleAnswers);
  doc.text(`Male Score: ${maleScore.percent}%`, 10, y);

  doc.save('MarriageTestResult.pdf');
}

// Show messages
function showMessage(msg) {
  if(messageDiv){
    messageDiv.innerText = msg;
    messageDiv.classList.remove('hidden');
  } else {
    alert(msg);
  }
}
