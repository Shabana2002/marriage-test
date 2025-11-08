let role = '';
let code = '';
let sessionData = {};

const startBtn = document.getElementById('startBtn');
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
  document.getElementById('formPage').classList.remove('hidden');
  document.getElementById('formTitle').innerText = role==='female' ? 'Answer Questions (Female)' : 'Answer Questions (Male)';
  populateForm();
}

function populateForm() {
  const form = document.getElementById('questionForm');
  form.innerHTML = '';
  const questions = role==='female' ? window.QUESTIONS.sectionA : window.QUESTIONS.sectionA.concat(window.QUESTIONS.sectionB);

  questions.forEach(q => {
    const div = document.createElement('div');
    div.classList.add('question');
    div.innerHTML = `<p>${q.text}</p>`;
    if(q.options){
      q.options.forEach(opt => {
        const id = role + '_' + q.id + '_' + opt;
        div.innerHTML += `<label><input type="${Array.isArray(q.options)? 'checkbox':'radio'}" name="${q.id}" value="${opt}"> ${opt}</label><br>`;
      });
    } else if(q.mapping) {
      Object.keys(q.mapping).forEach(k => {
        div.innerHTML += `<label>${k}: <input type="text" name="${q.id}_${k}"></label><br>`;
      });
    }
    form.appendChild(div);
  });
}

async function submitAnswers() {
  const form = document.getElementById('questionForm');
  const formData = new FormData(form);
  const ans = {};

  for (let pair of formData.entries()) {
    const key = pair[0];
    const val = pair[1];
    if(ans[key]){
      if(!Array.isArray(ans[key])) ans[key] = [ans[key]];
      ans[key].push(val);
    } else {
      ans[key] = val;
    }
  }

  if(role==='female'){
    // Save female answers via backend
    const res = await fetch('/api/session', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ femaleAnswers: ans })
    });
    const data = await res.json();
    code = data.code;
    sessionData.femaleAnswers = ans;

    document.getElementById('formPage').classList.add('hidden');
    document.getElementById('resultPage').classList.remove('hidden');
    document.getElementById('resultContent').innerHTML = `<p>Share this link with male partner: <a href="?code=${code}" target="_blank">${location.origin}?code=${code}</a></p>`;

    downloadBtn.classList.add('hidden');
    startOverBtn.classList.add('hidden');
  } else {
    // Male flow
    code = new URLSearchParams(window.location.search).get('code');
    if(!code){ alert('No session code provided'); return; }

    // Fetch female answers
    const stored = await fetch('/api/session/' + code).then(r=>r.json());
    if(!stored.femaleAnswers){ alert('Session not found'); return; }
    sessionData.femaleAnswers = stored.femaleAnswers;
    sessionData.maleAnswers = ans;

    // Section B answers
    const sectionB = {};
    window.QUESTIONS.sectionB.forEach(q=>{
      if(q.mapping){
        Object.keys(q.mapping).forEach(k=>{
          sectionB[q.id+'_'+k] = ans[q.id+'_'+k] || '';
        });
      } else {
        sectionB[q.id] = ans[q.id] || '';
      }
    });
    sessionData.maleAnswers_sectionB = sectionB;

    // Calculate score
    const secA = window.SCORING.scoreSectionA(sessionData.femaleAnswers, sessionData.maleAnswers);
    const secB = window.SCORING.scoreSectionB(sessionData.maleAnswers_sectionB);
    sessionData.percent = secA.percent;
    sessionData.tier = window.RESULTS.tier(secA.percent);
    sessionData.maleScore = secB;

    // Save male answers to backend
    await fetch('/api/session/' + code + '/complete', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ maleAnswers: ans, maleAnswers_sectionB: sectionB, percent: sessionData.percent, tier: sessionData.tier, maleScore: sessionData.maleScore })
    });

    document.getElementById('formPage').classList.add('hidden');
    document.getElementById('resultPage').classList.remove('hidden');
    document.getElementById('resultContent').innerHTML = `<p>Test completed! You can download your PDF below.</p>`;

    downloadBtn.classList.remove('hidden');
    startOverBtn.classList.remove('hidden');
  }
}

function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'pt', 'a4');
  let y = 40;

  doc.setFontSize(18);
  doc.text("Marriage Compatibility Report", 40, y);
  y += 30;

  // Section A Table
  doc.setFontSize(14);
  doc.text("Section A - Compatibility Questions", 40, y);
  y += 20;

  const mapQ = {
    q1:'Why do you want to get married?',
    q2:'Thoughts on feminism',
    q3:'Lessons from past relationships',
    q4:'Handling stress',
    q5:'What makes a good partner?',
    q6:'Qualities desired',
    q7:'Dealbreakers',
    q8:'Living with in-laws',
    q9:'Hobbies',
    q10:'Ideal child'
  };

  for (const k of Object.keys(mapQ)) {
    const ya = sessionData.femaleAnswers[k] || '';
    const yb = sessionData.maleAnswers[k] || '';
    let match = '';

    if (k==='q6'||k==='q9') {
      const j = window.SCORING.jaccard(ya||[], yb||[]);
      match = Math.round(j*100) + '% match';
    } else {
      match = (ya && yb && ya===yb) ? '✅' : '❌';
    }

    doc.setFontSize(12);
    doc.text(mapQ[k], 40, y);
    y += 15;
    doc.text("Female: " + (Array.isArray(ya)? ya.join(', '): ya), 60, y);
    y += 15;
    doc.text("Male: " + (Array.isArray(yb)? yb.join(', '): yb), 60, y);
    y += 15;
    doc.text("Match: " + match, 60, y);
    y += 25;

    if(y > 750){ doc.addPage(); y = 40; }
  }

  // Section B - Male Only
  if(sessionData.maleAnswers_sectionB){
    doc.setFontSize(14);
    doc.text("Section B - Health Awareness (Male)", 40, y);
    y += 20;

    const b = sessionData.maleAnswers_sectionB;

    ['periods','cramps','ovulation','hymen','vagina'].forEach(k=>{
      doc.setFontSize(12);
      doc.text(`${k}: ${b['b1_'+k]||''}`, 60, y);
      y+=15;
    });

    ['b2','b3','b4','b5'].forEach(k=>{
      let ans = b[k];
      if(Array.isArray(ans)) ans = ans.join(', ');
      doc.text(`${k}: ${ans||''}`, 40, y);
      y+=20;
      if(y>750){ doc.addPage(); y=40; }
    });
  }

  // Summary
  doc.setFontSize(14);
  y += 10;
  doc.text("Overall Compatibility: " + sessionData.percent + "% (" + sessionData.tier + ")", 40, y);
  y += 20;
  if(sessionData.maleScore){
    doc.text(`Health Awareness Score (Male): ${sessionData.maleScore.points}/${sessionData.maleScore.possible} (${sessionData.maleScore.percent}%)`, 40, y);
  }

  doc.save("compatibility_report.pdf");
}
