// ===== Expenses Functions =====
let store = {};
let currentPeriod = '';
let lastDeleted = null;

function initExpenses() {
  // Load selected period from localStorage or use current period
  const selectedPeriod = localStorage.getItem('selected_period');
  if (selectedPeriod) {
    currentPeriod = selectedPeriod;
  } else {
    const now = new Date();
    currentPeriod = toPeriod(now.getFullYear(), now.getMonth() + 1);
  }
  
  loadStore();
  bindExpensesEvents();
  renderExpenses();
}

function renderExpenses() {
  ensurePeriod(currentPeriod);
  const p = store[currentPeriod];
  
  // Render full transaction list (both income and expenses)
  const expenseList = document.getElementById('expense-list');
  expenseList.innerHTML = '';
  
  // Combine income and expenses with timestamps
  const allTransactions = [];
  
  // Add income transactions
  if (p.income) {
    p.income.forEach(income => {
      allTransactions.push({
        type: 'income',
        name: income.source,
        amount: income.amount,
        timestamp: income.timestamp
      });
    });
  }
  
  // Add expense transactions
  if (p.expenses) {
    p.expenses.forEach(expense => {
      allTransactions.push({
        type: 'expense',
        name: expense.name,
        amount: expense.amount,
        timestamp: expense.timestamp
      });
    });
  }
  
  // Sort by timestamp (newest first)
  allTransactions.sort((a, b) => b.timestamp - a.timestamp);
  
  if(allTransactions.length === 0){
    expenseList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <h3 class="text-h3 mb-2">No transactions yet</h3>
        <p class="text-body text-secondary">Add your first transaction to get started</p>
      </div>
    `;
  } else {
    allTransactions.forEach(transaction => {
      const row = document.createElement('div');
      row.className = 'expense-item';
      
      const isIncome = transaction.type === 'income';
      const sign = isIncome ? '+' : '-';
      const amountClass = isIncome ? 'text-success' : 'text-danger';
      const icon = isIncome ? '💰' : '🛒';
      
      row.innerHTML = `
        <div class="expense-details">
          <div class="text-body font-medium">${icon} ${escapeHtml(transaction.name||'—')}</div>
          <div class="text-caption text-tertiary">${new Date(transaction.timestamp).toLocaleString()}</div>
        </div>
        <div class="expense-actions">
          <div class="text-body font-medium mr-4 ${amountClass}">${sign}${fmt(transaction.amount)}</div>
        </div>
      `;
      expenseList.appendChild(row);
    });
  }
  
  document.getElementById('current-period').textContent = periodDisplay(currentPeriod);
  saveStore();
}

function bindExpensesEvents() {
  // Navigation events
  document.getElementById('back-to-dashboard').addEventListener('click', function() {
    window.location.href = 'dashboard.html';
  });
  
  // Period navigation events
  document.getElementById('prev-month-btn').addEventListener('click', ()=> shiftMonth(-1));
  document.getElementById('next-month-btn').addEventListener('click', ()=> shiftMonth(1));
  document.getElementById('today-btn').addEventListener('click', ()=> {
    const now = new Date();
    currentPeriod = toPeriod(now.getFullYear(), now.getMonth()+1);
    renderExpenses();
  });
  
  // Clear month event
  document.getElementById('clear-month-btn').addEventListener('click', clearMonth);
}

function clearMonth(){
  if(!confirm(`Clear all data for ${currentPeriod}?`)) return;
  ensurePeriod(currentPeriod);
  const old = JSON.parse(JSON.stringify(store[currentPeriod]));
  lastDeleted = { period: currentPeriod, data: old, when: Date.now() };
  store[currentPeriod] = { budget:0, added:0, expenses:[], income:[] };
  saveStore(); renderExpenses();
  document.getElementById('last-action').textContent = `Cleared ${currentPeriod}`;
  
  // Add undo button
  const undoBtn = document.createElement('button');
  undoBtn.className = 'btn btn-ghost ml-2';
  undoBtn.textContent = 'Undo';
  undoBtn.onclick = () => { undoClear(); undoBtn.remove(); };
  document.getElementById('last-action').appendChild(undoBtn);
  
  setTimeout(()=>{ 
    if(undoBtn.parentNode) undoBtn.remove(); 
    lastDeleted=null; 
  }, 8000);
}

function undoClear(){ 
  if(!lastDeleted) return alert('Nothing to undo'); 
  store[lastDeleted.period] = lastDeleted.data; 
  saveStore(); 
  lastDeleted=null; 
  renderExpenses(); 
  document.getElementById('last-action').textContent='Undo successful'; 
}

function shiftMonth(delta){ 
  const {year, month} = parsePeriod(currentPeriod); 
  let d = new Date(year, month-1 + delta, 1); 
  currentPeriod = toPeriod(d.getFullYear(), d.getMonth()+1); 
  renderExpenses(); 
}