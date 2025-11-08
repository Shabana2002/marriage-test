let role = '';
let code = '';
let sessionData = {};

const startBtn = document.getElementById('takeTest');
const femaleBtn = document.getElementById('femaleBtn');
const maleBtn = document.getElementById('maleBtn');
const formPage = document.getElementById('formPage');
const guidelinesPage = document.getElementById('guidelines');
const roleSelectPage = document.getElementById('roleSelect');
const formTitle = document.getElementById('formTitle');
const testForm = document.getElementById('testForm');
const downloadBtn = document.getElementById('downloadPDF');
const startOverBtn = document.getElementById('startOver');

const urlParams = new URLSearchParams(window.location.search);
code = urlParams.get('code');

if (code) {
  loadSession(code).then(() => {
    if (sessionData.submittedMale) {
      showDownloadButton();
      alert('Both have completed. You can download the PDF.');
    } else {
      role = 'male';
      startTest('male');
    }
  });
} else {
  guidelinesPage.classList.remove('hidden');
}

startBtn.addEventListener('click', () => {
  guidelinesPage.classList.add('hidden');
  roleSelectPage.classList.remove('hidden');
});

femaleBtn.addEventListener('click', () => startTest('female'));
maleBtn.addEventListener('click', () => startTest('male'));
downloadBtn.addEventListener('click', downloadPDF);
startOverBtn.addEventListener('click', () => location.reload());

async function loadSession(sessionCode) {
  const res = await fetch(`/api/session/${sessionCode}`);
  const data = await res.json();
  sessionData = data;
}

function startTest(selectedRole) {
  role = selectedRole;
  roleSelectPage.classList.add('hidden');
  formPage.classList.remove('hidden');
  formTitle.textContent = role === 'female'
    ? 'Section A — Compatibility'
    : 'Sections A & B — Compatibility + Awareness';
  populateQuestions();
}

function populateQuestions() {
  testForm.innerHTML = '';
  const questionsA = window.QUESTIONS.sectionA;
  const questionsB = window.QUESTIONS.sectionB;
  const allQuestions = role === 'female' ? questionsA : questionsA.concat(questionsB);

  allQuestions.forEach(q => {
    const div = document.createElement('div');
    div.className = 'question';
    div.innerHTML = `<p>${q.text}</p>`;
    if (q.options) {
      const inputType = q.multiple ? 'checkbox' : 'radio';
      q.options.forEach(opt => {
        div.innerHTML += `<label><input type="${inputType}" name="${q.id}" value="${opt}"> ${opt}</label>`;
      });
    }
    testForm.appendChild(div);
  });

  const actions = document.createElement('div');
  actions.className = 'actions';
  actions.innerHTML = `
    <button type="button" id="submitBtn">Submit Test</button>
    <button type="button" id="downloadLocal">Download PDF</button>
  `;
  testForm.appendChild(actions);

  document.getElementById('submitBtn').addEventListener('click', handleSubmit);
  document.getElementById('downloadLocal').addEventListener('click', () => {
    if (!sessionData.submittedFemale || !sessionData.submittedMale)
      return alert('Both must submit before download.');
    downloadPDF();
  });
}

async function handleSubmit() {
  const answers = collectAnswers();

  try {
    if (role === 'female' && !code) {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ femaleAnswers: answers })
      });
      const data = await res.json();
      code = data.code;
      sessionData = data;
      alert('Your test was submitted! Share this link with your partner:\n\n' + `${window.location.origin}/?code=${code}`);
    } else if (role === 'male') {
      const res = await fetch(`/api/session/${code}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maleAnswers: answers })
      });
      const data = await res.json();
      sessionData = data;
      alert('Test submitted! You can now download the PDF.');
      showDownloadButton();
    }
  } catch (err) {
    alert('Submission failed: ' + err.message);
  }
}

function collectAnswers() {
  const result = {};
  const elements = testForm.querySelectorAll('input');
  elements.forEach(el => {
    if (el.type === 'radio' && el.checked)
      result[el.name] = el.value;
    if (el.type === 'checkbox') {
      if (!result[el.name]) result[el.name] = [];
      if (el.checked) result[el.name].push(el.value);
    }
  });
  return result;
}

function showDownloadButton() {
  downloadBtn.classList.remove('hidden');
}

async function downloadPDF() {
  if (!sessionData.femaleAnswers || !sessionData.maleAnswers)
    return alert('Both must complete the test first.');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 10;
  doc.text('Marriage Compatibility & Awareness Report', 10, y);
  y += 10;
  window.QUESTIONS.sectionA.forEach(q => {
    const fAns = sessionData.femaleAnswers[q.id] || '-';
    const mAns = sessionData.maleAnswers[q.id] || '-';
    doc.text(q.text, 10, y);
    y += 6;
    doc.text('Female: ' + fAns, 10, y);
    doc.text('Male: ' + mAns, 100, y);
    y += 10;
  });
  y += 10;
  doc.text('Section B — Male Awareness', 10, y);
  y += 10;
  const maleScore = window.SCORING.scoreSectionB(sessionData.maleAnswers);
  doc.text(`Male Awareness Score: ${maleScore.percent}%`, 10, y);
  doc.save('MarriageTestResult.pdf');
}
