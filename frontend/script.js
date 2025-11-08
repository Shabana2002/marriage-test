
// Final front-end script for Marriage Match Test
const app = document.querySelector('.card');
let role = null;
let sessionCode = null;
let disqualified = false;

document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('takeTest').addEventListener('click', ()=> showRoleSelect());
  document.getElementById('femaleBtn').addEventListener('click', ()=> start('female'));
  document.getElementById('maleBtn').addEventListener('click', ()=> start('male'));
  document.getElementById('startOver').addEventListener('click', ()=> location.reload());
  // handle shared code
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  if(code){ sessionCode = code; showRoleSelect(true); }

  // warn on leave/refresh
  window.addEventListener('beforeunload', (e)=>{
    e.preventDefault();
    e.returnValue = '';
  });

  // visibility change: prompt and disqualify if leaving
  document.addEventListener('visibilitychange', ()=>{
    if(document.hidden){
      const stay = confirm('You are leaving the test. If you exit now, the session will be disqualified and cannot be reused. Click OK to leave and be disqualified, or Cancel to stay.');
      if(stay){
        // user chose to leave: mark disqualified if session exists
        disqualified = true;
        if(sessionCode) {
          const s = JSON.parse(localStorage.getItem('mm_'+sessionCode) || '{}');
          s.disqualified = true; localStorage.setItem('mm_'+sessionCode, JSON.stringify(s));
        }
        // navigate away
        window.location.href = 'about:blank';
      } else {
        // user chose to stay: do nothing
      }
    }
  });
});

function showRoleSelect(shared=false){
  document.getElementById('guidelines').classList.add('hidden');
  document.getElementById('roleSelect').classList.remove('hidden');
  if(shared){
    document.getElementById('femaleBtn').disabled = true;
    document.getElementById('roleNote').textContent = 'This link is for the male partner to complete his section.';
  } else {
    document.getElementById('femaleBtn').disabled = false;
    document.getElementById('roleNote').textContent = '';
  }
}

function start(chosenRole){
  role = chosenRole;
  document.getElementById('roleSelect').classList.add('hidden');
  document.getElementById('formPage').classList.remove('hidden');
  // show sectionB only for male
  if(role==='male'){ document.getElementById('sectionB').classList.remove('hidden'); } else { document.getElementById('sectionB').classList.add('hidden'); }
  renderQuestions();
  document.getElementById('testForm').onsubmit = (e)=>{ e.preventDefault(); submitAnswers(); };
  document.getElementById('downloadLocal').onclick = ()=> { const a = collectAnswers(); downloadJSON(a); };
}

function renderQuestions(){
  const q = window.QUESTIONS.sectionA;
  const container = document.getElementById('questions');
  container.innerHTML = '';
  q.forEach((item, idx)=>{
    const div = document.createElement('div'); div.className='field';
    let html = `<label>${idx+1}. ${item.text}</label>`;
    if(idx===5 || idx===8){ // multi-select q6 and q9 (indexes 5 and 8)
      html += '<div class="multiselect">';
      item.options.forEach(opt=>{ html += `<label><input type="checkbox" name="q${idx+1}" value="${opt}"> ${opt}</label>`; });
      html += '</div>';
    } else {
      html += `<select name="q${idx+1}" required><option value="">Select…</option>`;
      item.options.forEach((opt,i)=>{
        const val = ['A','B','C','D'][i] || opt;
        html += `<option value="${val}">${opt}</option>`;
      });
      html += '</select>';
    }
    div.innerHTML = html;
    container.appendChild(div);
  });
  // render sectionB area (template)
  const sb = window.QUESTIONS.sectionB;
  const sbDiv = document.getElementById('sectionB');
  sbDiv.innerHTML = `<h3>Section B — Reproductive & Period Knowledge (male only)</h3>
    <p>This section is for awareness only; it does not affect compatibility percentage.</p>
    <div class="field"><label>1. Match the following (select the correct term):</label>
      <label>Periods:<select name="b1_periods"><option value="">Select…</option><option value="Periods">Periods</option><option value="Cramps">Cramps</option><option value="Ovulation">Ovulation</option><option value="Hymen">Hymen</option><option value="Vagina">Vagina</option></select></label>
      <label>Cramps:<select name="b1_cramps"><option value="">Select…</option><option value="Periods">Periods</option><option value="Cramps">Cramps</option><option value="Ovulation">Ovulation</option><option value="Hymen">Hymen</option><option value="Vagina">Vagina</option></select></label>
      <label>Ovulation:<select name="b1_ovulation"><option value="">Select…</option><option value="Periods">Periods</option><option value="Cramps">Cramps</option><option value="Ovulation">Ovulation</option><option value="Hymen">Hymen</option><option value="Vagina">Vagina</option></select></label>
      <label>Hymen:<select name="b1_hymen"><option value="">Select…</option><option value="Periods">Periods</option><option value="Cramps">Cramps</option><option value="Ovulation">Ovulation</option><option value="Hymen">Hymen</option><option value="Vagina">Vagina</option></select></label>
      <label>Vagina:<select name="b1_vagina"><option value="">Select…</option><option value="Periods">Periods</option><option value="Cramps">Cramps</option><option value="Ovulation">Ovulation</option><option value="Hymen">Hymen</option><option value="Vagina">Vagina</option></select></label>
    </div>
    <div class="field"><label>2. Do urine and menstrual blood come from the same passage?</label><select name="b2"><option value="">Select…</option><option value="A">A: Yes</option><option value="B">B: No</option><option value="C">C: Maybe</option></select></div>
    <div class="field"><label>3. How many days are periods typically?</label><select name="b3"><option value="">Select…</option><option value="A">A: 1–3 days</option><option value="B">B: 3–7 days</option><option value="C">C: 8–10 days</option><option value="D">D: More than 10 days</option></select></div>
    <div class="field"><label>4. Name three necessities used during periods (choose any)</label><div class="multiselect"><label><input type="checkbox" name="b4" value="Sanitary pads">Sanitary pads</label><label><input type="checkbox" name="b4" value="Tampons">Tampons</label><label><input type="checkbox" name="b4" value="Menstrual cup">Menstrual cup</label><label><input type="checkbox" name="b4" value="Painkillers">Painkillers</label><label><input type="checkbox" name="b4" value="Heating pad">Heating pad</label><label><input type="checkbox" name="b4" value="Clean underwear">Clean underwear</label></div></div>
    <div class="field"><label>5. Can a person menstruate and still have sex?</label><select name="b5"><option value="">Select…</option><option value="A">A: No — never</option><option value="B">B: Yes — it is possible; depends on comfort and consent</option><option value="C">C: Only if married</option></select></div>`;
}

function collectAnswers(){
  const form = document.getElementById('testForm'); const fd = new FormData(form);
  const sectionA = {};
  for(let i=1;i<=10;i++){
    const k='q'+i;
    if(i===6 || i===9){
      const arr=[]; form.querySelectorAll('input[name="'+k+'"]:checked').forEach(ch=>arr.push(ch.value)); sectionA[k]=arr;
    } else {
      sectionA[k]=fd.get(k);
    }
  }
  const sectionB = {};
  const sbDiv = document.getElementById('sectionB');
  if(!sbDiv.classList.contains('hidden')){
    sectionB['b1_periods']=fd.get('b1_periods');
    sectionB['b1_cramps']=fd.get('b1_cramps');
    sectionB['b1_ovulation']=fd.get('b1_ovulation');
    sectionB['b1_hymen']=fd.get('b1_hymen');
    sectionB['b1_vagina']=fd.get('b1_vagina');
    sectionB['b2']=fd.get('b2');
    sectionB['b3']=fd.get('b3');
    const b4=[]; form.querySelectorAll('input[name="b4"]:checked').forEach(ch=>b4.push(ch.value)); sectionB['b4']=b4;
    sectionB['b5']=fd.get('b5');
  }
  return { sectionA, sectionB };
}

function submitAnswers(){
  const ans = collectAnswers();
  if(role==='female'){
    // create session and save female answers
    const code = 'MM'+Math.random().toString(36).slice(2,8).toUpperCase();
    const payload = { code: code, createdAt: Date.now(), femaleAnswers: ans.sectionA, disqualified: false };
    localStorage.setItem('mm_'+code, JSON.stringify(payload));
    sessionCode = code;
    // show waiting page with share link
    document.getElementById('formPage').classList.add('hidden'); document.getElementById('resultPage').classList.remove('hidden');
    document.getElementById('resultContent').innerHTML = '<p>Session created. Share this link with your partner: <strong>?code='+code+'</strong></p><p>Waiting for partner to submit...</p>';
  } else {
    // male flow: must have a code in URL
    const params = new URLSearchParams(location.search); const code = params.get('code');
    if(!code){ alert('You must open the link sent by the female partner.'); return; }
    const stored = JSON.parse(localStorage.getItem('mm_'+code) || '{}');
    if(!stored || !stored.femaleAnswers){ alert('Session not found or expired.'); return; }
    if(stored.disqualified){ alert('This session is disqualified and cannot be used.'); return; }
    // save male answers
    stored.maleAnswers = ans.sectionA;
    stored.maleAnswers_sectionB = ans.sectionB;
    stored.completedAt = Date.now();
    localStorage.setItem('mm_'+code, JSON.stringify(stored));
    // compute results
    const comp = window.SCORING.scoreSectionA(stored.femaleAnswers, stored.maleAnswers);
    const maleScore = window.SCORING.scoreSectionB(stored.maleAnswers_sectionB || {});
    const tier = window.RESULTS.tier(comp.percent);
    document.getElementById('formPage').classList.add('hidden'); document.getElementById('resultPage').classList.remove('hidden');
    const compHtml = window.RESULTS.renderCompatibility(stored.femaleAnswers, stored.maleAnswers);
    const summary = window.RESULTS.renderSummary(comp.percent, tier, maleScore);
    let html = '<h3>Compatibility Score: '+comp.percent+'%</h3><p><strong>'+tier+'</strong></p>'+compHtml+'<hr/>'+
      '<h3>Male Awareness (Section B)</h3><p>Total: '+maleScore.points+' / '+maleScore.possible+' ('+maleScore.percent+'%)</p>';
    html += renderMaleBDetails(stored.maleAnswers_sectionB || {});
    html += summary;
    document.getElementById('resultContent').innerHTML = html;
    // set download
    document.getElementById('downloadPDF').onclick = ()=> downloadPDFForSession({code: code, comp: comp, maleScore: maleScore, female: stored.femaleAnswers, male: stored.maleAnswers, maleB: stored.maleAnswers_sectionB});
  }
}

function renderMaleBDetails(sb){
  if(!sb) return '<p>No Section B answers.</p>';
  const correctMap = {'b1_periods':'Periods','b1_cramps':'Cramps','b1_ovulation':'Ovulation','b1_hymen':'Hymen','b1_vagina':'Vagina'};
  let html = '<table class="resultTable"><thead><tr><th>Question</th><th>Answer</th><th>Correct?</th></tr></thead><tbody>';
  Object.keys(correctMap).forEach(k=>{ const ans = sb[k] || ''; const ok = ans === correctMap[k] ? '✅' : '❌ ('+correctMap[k]+')'; html += `<tr><td>Match: ${k.replace('b1_','')}</td><td>${ans}</td><td>${ok}</td></tr>`; });
  const qmap = {'b2':'Urine and menstrual blood same passage?','b3':'Typical days of period','b4':'Necessities chosen','b5':'Can menstruate and still have sex?'};
  const correct = {'b2':'B','b3':'B','b5':'B'};
  Object.keys(qmap).forEach(k=>{ const ans = Array.isArray(sb[k])?sb[k].join(', '):sb[k]||''; let ok = ''; if(k in correct){ ok = ans === correct[k] ? '✅' : '❌ ('+correct[k]+')'; } html += `<tr><td>${qmap[k]}</td><td>${ans}</td><td>${ok}</td></tr>`; });
  html += '</tbody></table>';
  return html;
}

function downloadJSON(obj){ const blob = new Blob([JSON.stringify(obj, null, 2)], {type:'application/json'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'answers_'+(obj.code||'session')+'.json'; a.click(); URL.revokeObjectURL(a.href); }

function downloadPDFForSession(obj){
  if(!window.jspdf){ alert('PDF library not loaded'); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 15;
  doc.setFontSize(12);
  doc.text('Compatibility: ' + obj.comp.percent + '% (' + (obj.comp.percent>=90?'Excellent': obj.comp.percent>=80?'Good': obj.comp.percent>=70?'Average': obj.comp.percent>=60?'Low':'Not Compatible') + ')', 10, y); y += 8;
  doc.text('Male Awareness: ' + obj.maleScore.points + ' / ' + obj.maleScore.possible + ' (' + obj.maleScore.percent + '%)', 10, y); y += 10;
  doc.text('--- Section A: Answers (Female vs Male) ---', 10, y); y += 8;
  // list Q&A
  const mapQ = { q1:'Why do you want to get married?', q2:'Thoughts on feminism', q3:'Lessons from past relationships', q4:'Handling stress', q5:'What makes a good partner?', q6:'Qualities desired', q7:'Dealbreakers', q8:'Living with in-laws', q9:'Hobbies', q10:'Ideal child' };
  Object.keys(mapQ).forEach(k=>{
    const f = (obj.female[k] && (Array.isArray(obj.female[k])?obj.female[k].join(', '):obj.female[k])) || '';
    const m = (obj.male[k] && (Array.isArray(obj.male[k])?obj.male[k].join(', '):obj.male[k])) || '';
    doc.text(mapQ[k] + ' — F: ' + f, 10, y); y += 6; doc.text('M: ' + m, 10, y); y += 8;
    if(y>270){ doc.addPage(); y=15; }
  });
  doc.text('--- Section B: Male Answers (correctness shown) ---', 10, y); y += 8;
  // B answers
  const b = obj.maleB || {};
  const correctMap = {'b1_periods':'Periods','b1_cramps':'Cramps','b1_ovulation':'Ovulation','b1_hymen':'Hymen','b1_vagina':'Vagina'};
  Object.keys(correctMap).forEach(k=>{
    const ans = b[k]||''; const ok = ans === correctMap[k] ? '✔' : '✖ ('+correctMap[k]+')';
    doc.text(k.replace('b1_','') + ': ' + ans + ' — ' + ok, 10, y); y += 6; if(y>270){ doc.addPage(); y=15; }
  });
  const qmap = {'b2':'Urine & menstrual blood same passage?','b3':'Typical days of period','b4':'Necessities chosen','b5':'Can menstruate and still have sex?'};
  const correct = {'b2':'B','b3':'B','b5':'B'};
  Object.keys(qmap).forEach(k=>{
    const ans = Array.isArray(b[k])?b[k].join(', '):b[k]||''; const ok = (k in correct) ? (ans===correct[k]?'✔':'✖ ('+correct[k]+')') : '';
    doc.text(qmap[k] + ': ' + ans + ' — ' + ok, 10, y); y += 6; if(y>270){ doc.addPage(); y=15; }
  });
  doc.text('Auto-deleted after 30 days.', 10, y+10);
  doc.save('MarriageMatchResults_' + (obj.code || 'session') + '.pdf');
}
