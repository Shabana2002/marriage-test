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

console.log("✅ script.js loaded");

// ---- Check session if code exists ---- //
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

// ---- Event Listeners ---- //
startBtn.addEventListener('click', () => {
  console.log("Take Test clicked");
  guidelinesPage.classList.add('hidden');
  roleSelectPage.classList.remove('hidden');
});

femaleBtn.addEventListener('click', () => {
  console.log("Female button clicked");
  startTest('female');
});

maleBtn.addEventListener('click', () => {
  console.log("Male button clicked");
  startTest('male');
});

downloadBtn.addEventListener('click', downloadPDF);
startOverBtn.addEventListener('click', () => location.reload());

// ---- Warn before leaving ---- //
window.addEventListener('beforeunload', (e) => {
  e.preventDefault();
  e.returnValue = 'Are you sure you want to leave? Your progress will be lost.';
});

// ---- Load existing session ---- //
async function loadSession(sessionCode) {
  try {
    const res = await fetch(`/api/session/${sessionCode}`);
    sessionData = await res.json();
  } catch (err) {
    console.error('Error loading session:', err);
  }
}

// ---- Start Test ---- //
function startTest(selectedRole) {
  role = selectedRole;
  roleSelectPage.classList.add('hidden');
  formPage.classList.remove('hidden');
  formTitle.textContent =
    role === 'female'
      ? 'Section A — Compatibility'
      : 'Sections A & B — Compatibility + Awareness';
  populateQuestions();
}

// ---- Populate Questions ---- //
function populateQuestions() {
  testForm.innerHTML = '';

  const questionsA = window.QUESTIONS.sectionA;
  const questionsB = window.QUESTIONS.sectionB;

  const all = role === 'female' ? questionsA : questionsA.concat(questionsB);

  all.forEach((q) => {
    const div = document.createElement('div');
    div.className = 'question';
    div.innerHTML = `<p>${q.text}</p>`;

    if (q.options) {
      const inputType = q.multiple ? 'checkbox' : 'radio';
      q.options.forEach((opt) => {
        div.innerHTML += `<label><input type="${inputType}" name="${q.id}" value="${opt}"> ${opt}</label>`;
      });
    } else if (q.mapping) {
      Object.keys(q.mapping).forEach((term) => {
        const label = document.createElement('label');
        label.textContent = term + ': ';
        const select = document.createElement('select');
        select.name = `${q.id}_${term}`;
        const dropdownItems = ["Periods", "Cramps", "Ovulation", "Hymen", "Vagina"];
        dropdownItems.forEach((desc) => {
          const opt = document.createElement('option');
          opt.value = desc;
          opt.textContent = desc;
          select.appendChild(opt);
        });
        label.appendChild(select);
        div.appendChild(label);
        div.appendChild(document.createElement('br'));
      });
    }

    testForm.appendChild(div);
  });

  // Add Submit & Download buttons
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

// ---- Handle Submission ---- //
async function handleSubmit() {
  const answers = collectAnswers();
  try {
    if (role === 'female' && !code) {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ femaleAnswers: answers }),
      });
      const data = await res.json();
      code = data.code;
      sessionData = data;

      // Show shareable link below submit button
      const submitBtn = document.getElementById('submitBtn');
      submitBtn.disabled = true; // disable to prevent multiple submissions

      let linkDiv = document.getElementById('shareLinkDiv');
      if (!linkDiv) {
        linkDiv = document.createElement('div');
        linkDiv.id = 'shareLinkDiv';
        linkDiv.style.marginTop = '10px';
        submitBtn.parentNode.appendChild(linkDiv);
      }
      const shareURL = `${window.location.origin}/?code=${code}`;
      linkDiv.innerHTML = `
        <p>Female test submitted! Share this link with your partner:</p>
        <input type="text" value="${shareURL}" readonly style="width: 100%;"/>
        <button id="copyLinkBtn">Copy Link</button>
      `;

      document.getElementById('copyLinkBtn').addEventListener('click', () => {
        const input = linkDiv.querySelector('input');
        input.select();
        input.setSelectionRange(0, 99999);
        document.execCommand('copy');
        alert('Link copied to clipboard!');
      });

    } else if (role === 'male') {
      const res = await fetch(`/api/session/${code}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maleAnswers: answers }),
      });
      const data = await res.json();
      sessionData = data;
      alert('Male test submitted! Now you can download the PDF.');
      showDownloadButton();
    }
  } catch (err) {
    alert('Submission failed: ' + err.message);
  }
}

// ---- Collect Answers ---- //
function collectAnswers() {
  const out = {};
  testForm.querySelectorAll('input, select').forEach((el) => {
    if (el.type === 'radio' && el.checked) out[el.name] = el.value;
    else if (el.type === 'checkbox') {
      if (!out[el.name]) out[el.name] = [];
      if (el.checked) out[el.name].push(el.value);
    } else if (el.tagName.toLowerCase() === 'select') {
      out[el.name] = el.value;
    }
  });
  return out;
}

// ---- Show Download Button ---- //
function showDownloadButton() {
  downloadBtn.classList.remove('hidden');
}

// ---- Download PDF ---- //
async function downloadPDF() {
  if (!sessionData.femaleAnswers || !sessionData.maleAnswers)
    return alert('Both must complete the test first.');

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 10;

  doc.text('Marriage Compatibility & Awareness Report', 10, y);
  y += 10;
  doc.text('Section A — Compatibility', 10, y);
  y += 10;

  window.QUESTIONS.sectionA.forEach((q) => {
    const f = sessionData.femaleAnswers[q.id] || '-';
    const m = sessionData.maleAnswers[q.id] || '-';
    doc.text(q.text, 10, y);
    y += 6;
    doc.text('F: ' + f, 10, y);
    doc.text('M: ' + m, 100, y);
    y += 8;
  });

  y += 10;
  doc.text('Section B — Male Awareness', 10, y);
  y += 10;

  const maleScore = window.SCORING.scoreSectionB(sessionData.maleAnswers);
  doc.text(`Male Awareness Score: ${maleScore.percent}%`, 10, y);
  doc.save('MarriageTestResult.pdf');
}
