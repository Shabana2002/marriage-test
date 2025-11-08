
window.RESULTS = (function(){
  function tier(p){ if(p>=90) return 'Excellent Match'; if(p>=80) return 'Good Match'; if(p>=70) return 'Average Match'; if(p>=60) return 'Low Match'; return 'Not Compatible'; }
  function renderCompatibility(a,b){
    const mapQ = { q1:'Why do you want to get married?', q2:'Thoughts on feminism', q3:'Lessons from past relationships', q4:'Handling stress', q5:'What makes a good partner?', q6:'Qualities desired', q7:'Dealbreakers', q8:'Living with in-laws', q9:'Hobbies', q10:'Ideal child' };
    let rows=''; for(const k of Object.keys(mapQ)){ const ya=a[k]||''; const yb=b[k]||''; let match=''; if(k==='q6'||k==='q9'){ const j = window.SCORING.jaccard(a[k]||[], b[k]||[]); match = Math.round(j*100)+'% match'; } else { match = (ya && yb && ya===yb) ? '✅' : '❌'; } rows += `<tr><td>${mapQ[k]}</td><td>${Array.isArray(ya)?ya.join(', '):ya}</td><td>${Array.isArray(yb)?yb.join(', '):yb}</td><td>${match}</td></tr>`; } return `<table class="resultTable"><thead><tr><th>Question</th><th>Female</th><th>Male</th><th>Match</th></tr></thead><tbody>${rows}</tbody></table>`; }
  function renderSummary(percent, tierLabel, maleScore){ return `<div class="summaryCard"><h3>Compatibility Summary</h3><table><tr><td>Overall Compatibility</td><td>${percent}% (${tierLabel})</td></tr><tr><td>Health Awareness (Male)</td><td>${maleScore.points}/${maleScore.possible} (${maleScore.percent}%)</td></tr></table></div>`; }
  return { tier, renderCompatibility, renderSummary };
})();
