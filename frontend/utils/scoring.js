
window.SCORING = (function(){
  function jaccard(a,b){ if(!a||!b) return 0; const sa=new Set(a), sb=new Set(b); const inter=[...sa].filter(x=>sb.has(x)).length; const union=new Set([...sa,...sb]).size; return union===0?0:inter/union; }
  function scoreSectionA(a,b){
    const singles=['q1','q2','q3','q4','q5','q7','q8','q10'];
    let matched=0; singles.forEach(q=>{ if(a[q] && b[q] && a[q]===b[q]) matched++; });
    const j6 = jaccard(a['q6']||[], b['q6']||[]) * 1;
    const j9 = jaccard(a['q9']||[], b['q9']||[]) * 1;
    const totalPossible = singles.length + 1 + 1;
    const totalMatched = matched + j6 + j9;
    const percent = Math.round((totalMatched/totalPossible)*100);
    return { matched, j6, j9, percent };
  }
  function scoreSectionB(answers){
    let points=0, possible=0;
    // match items 5 points
    possible += 5;
    const correctMap = {periods:'Periods', cramps:'Cramps', ovulation:'Ovulation', hymen:'Hymen', vagina:'Vagina'};
    const keys = ['b1_periods','b1_cramps','b1_ovulation','b1_hymen','b1_vagina'];
    keys.forEach((k,i)=>{ if(answers[k] && answers[k]===Object.values(correctMap)[i]) points++; });
    // q2
    possible += 5; if(answers['b2']==='B') points += 5;
    // q3
    possible += 5; if(answers['b3']==='B') points += 5;
    // q4 multi (3 correct)
    possible += 5; const correctB4 = new Set(['Sanitary pads','Tampons','Menstrual cup']); const sel = answers['b4']||[]; let b4p=0; sel.forEach(s=>{ if(correctB4.has(s)) b4p++; }); points += b4p;
    // q5
    possible += 5; if(answers['b5']==='B') points += 5;
    const percent = Math.round((points/possible)*100);
    return { points, possible, percent };
  }
  return { jaccard, scoreSectionA, scoreSectionB };
})();
