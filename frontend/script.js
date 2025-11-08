let role = '';
let code = '';
let sessionData = {};

const startBtn = document.getElementById('startBtn');
const femaleBtn = document.getElementById('femaleBtn');
const maleBtn = document.getElementById('maleBtn');
const submitBtn = document.getElementById('submitBtn');
const downloadBtn = document.getElementById('downloadPDF');
const startOverBtn = document.getElementById('startOver');

// Set initial background for guidelines page
document.getElementById('guidelines').style.background = "url('./images/img1.jpg') no-repeat center center";
document.getElementById('guidelines').style.backgroundSize = "cover";

startBtn.addEventListener('click', () => {
  document.getElementById('guidelines').classList.add('hidden');
  const roleSelectPage = document.getElementById('roleSelect');
  roleSelectPage.classList.remove('hidden');

  // Set background for role selection page
  roleSelectPage.style.background = "url('./images/img2.jpg') no-repeat center center";
  roleSelectPage.style.backgroundSize = "cover";
});

femaleBtn.addEventListener('click', () => startTest('female'));
maleBtn.addEventListener('click', () => startTest('male'));

submitBtn.addEventListener('click', submitAnswers);
downloadBtn.addEventListener('click', downloadPDF);
startOverBtn.addEventListener('click', () => location.reload());

function startTest(selectedRole) {
  role = selectedRole;
  document.getElementById('roleSelect').classList.add('hidden');
  const formPage = document.getElementById('formPage');
  formPage.classList.remove('hidden');
  document.getElementById('formTitle').innerText = role === 'female' ? 'Answer Questions (Female)' : 'Answer Questions (Male)';

  // Add background image for form page
  formPage.style.background = "url('./images/img3.jpg') no-repeat center center";
  formPage.style.backgroundSize = "cover";

  populateForm();
}

function populateForm() {
  const form = document.getElementById('questionForm');
  form.innerHTML = '';
  const questions = role === 'female' ? window.QUESTIONS.sectionA : window.QUESTIONS.sectionA.concat(window.QUESTIONS.sectionB);

  questions.forEach(q => {
    const div = document.createElement('div');
    div.classList.add('question');
    div.innerHTML = `<p>${q.text}</p>`;
    if (q.options) {
      q.options.forEach(opt => {
        div.innerHTML += `<label><input type="${Array.isArray(q.options) ? 'checkbox' : 'radio'}" name="${q.id}" value="${opt}"> ${opt}</label><br>`;
      });
    } else if (q.mapping) {
      Object.keys(q.mapping).forEach(k => {
        div.innerHTML += `<label>${k}: <input type="text" name="${q.id}_${k}"></label><br>`;
      });
    }
    form.appendChild(div);
  });
}

// submitAnswers and downloadPDF remain the same as your code
// (no change needed for functionality)
