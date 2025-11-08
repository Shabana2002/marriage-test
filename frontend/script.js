let role = '';
let code = '';
let sessionData = {};

const startBtn = document.getElementById('takeTest');
const femaleBtn = document.getElementById('femaleBtn');
const maleBtn = document.getElementById('maleBtn');
const submitBtn = document.getElementById('submitBtn');
const downloadBtn = document.getElementById('downloadPDF');
const startOverBtn = document.getElementById('startOver');

startBtn.addEventListener('click', () => {
  document.getElementById('guidelines').classList.add('hidden');
  document.getElementById('roleSelect').classList.remove('hidden');
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
  populateForm();
}

function populateForm() {
  const form = document.getElementById('testForm');
  form.innerHTML = '';
  const questions = role === 'female' ? window.QUESTIONS.sectionA : window.QUESTIONS.sectionA.concat(window.QUESTIONS.sectionB);

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
    form.appendChild(div);
  });
}

// submitAnswers, downloadPDF, etc., would remain the same as before, using role & form data
