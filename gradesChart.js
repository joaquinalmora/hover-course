(function(){
  const gradeOrder = ['90-100%','85-89%','80-84%','76-79%','72-75%','68-71%','64-67%','60-63%','55-59%','50-54%','<50%'];
  const letterMap = {'90-100%':'A+','85-89%':'A','80-84%':'A-','76-79%':'B+','72-75%':'B','68-71%':'B-','64-67%':'C+','60-63%':'C','55-59%':'C-','50-54%':'D','<50%':'F'};
  const gradeRanges = {'90-100%':'90-100%','85-89%':'85-89%','80-84%':'80-84%','76-79%':'76-79%','72-75%':'72-75%','68-71%':'68-71%','64-67%':'64-67%','60-63%':'60-63%','55-59%':'55-59%','50-54%':'50-54%','<50%':'0-49%'};
  window.renderGradeChart = function(containerEl, dist, opts){
    const {avg,median,lower,upper,term,course,subject,courseNumber,section} = opts;
    const total = Object.values(dist).reduce((a,b)=>a+b,0);
    const maxCount = Math.max(...Object.values(dist));
    
    // Construct UBC grades URL
    let ubcGradesUrl = '';
    if (subject && courseNumber) {
      const sectionPart = section ? `-${section}` : '';
      ubcGradesUrl = `https://ubcgrades.com/#UBCO-${term}-${subject}-${courseNumber}${sectionPart}`;
    }
    
    let html = '';
    html += '<div style="width:500px;font-size:12px;line-height:1.2;font-family:Arial,sans-serif;background:white;border:1px solid #ddd;border-radius:8px;padding:12px;box-shadow:0 4px 12px rgba(0,0,0,0.15);">';
    
    if (ubcGradesUrl) {
      html += `<div style="font-weight:bold;margin-bottom:6px;color:#333;font-size:14px;text-align:center;"><a href="${ubcGradesUrl}" target="_blank" style="color:#2E5BBA;text-decoration:none;border-bottom:1px dotted #2E5BBA;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${course}</a> (${term})</div>`;
    } else {
      html += `<div style="font-weight:bold;margin-bottom:6px;color:#333;font-size:14px;text-align:center;">${course} (${term})</div>`;
    }
    html += `<div style="margin-bottom:8px;color:#333;font-size:12px;text-align:center;">Avg: ${avg % 1 === 0 ? Math.round(avg) : avg}% &nbsp;&nbsp;Median: ${median}% &nbsp;&nbsp;Q1: ${lower}% &nbsp;&nbsp;Q3: ${upper}%</div>`;
    html += '<div style="margin-top:6px;">';
    gradeOrder.forEach(range=>{
      const count = dist[range]||0;
      const barPct = maxCount? (count/maxCount)*100 : 0;
      html += '<div style="display:flex;align-items:center;margin-bottom:3px;">';
      html += `<span style="width:90px;font-weight:bold;color:#333;font-size:12px;text-align:center;">${letterMap[range]} (${gradeRanges[range]})</span>`;
      html += '<div style="flex:1;position:relative;height:10px;background:#f0f0f0;border-radius:5px;margin:0 8px;">';
      html += `<div style="height:100%;background:linear-gradient(135deg,#4B86DB,#2E5BBA);border-radius:5px;width:${barPct}%;transition:width 0.3s ease;"></div>`;
      html += '</div>';
      html += `<span style="width:35px;text-align:right;font-size:12px;color:#333;">${count}</span>`;
      html += '</div>';
    });
    html += '</div></div>';
    containerEl.innerHTML = html;
  };
})();