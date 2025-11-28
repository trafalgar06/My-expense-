// ===== Period Selection Functions =====
function buildPeriodSelects(){
  const now=new Date();
  const yNow=now.getFullYear();
  let years=[];
  for(let y=yNow-5;y<=yNow+2;y++) years.push(y);
  document.getElementById('year-select').innerHTML = years.map(y=>`<option value="${y}">${y}</option>`).join('');
  document.getElementById('month-select').innerHTML = MONTH_NAMES.map((m,i)=>`<option value="${i+1}">${m}</option>`).join('');
}

function syncSelectToCurrent(){ 
  const {year, month} = parsePeriod(currentPeriod); 
  document.getElementById('year-select').value = year; 
  document.getElementById('month-select').value = month; 
}

// navigation
function showTracker(){
  document.getElementById('period-screen').classList.add('hidden');
  document.getElementById('tracker-screen').classList.remove('hidden');
}

function showPeriodSelector(){
  document.getElementById('tracker-screen').classList.add('hidden');
  document.getElementById('period-screen').classList.remove('hidden');
}