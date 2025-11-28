// ===== Dashboard Functions =====
let store = {};
let currentPeriod = '';

function initDashboard() {
  // Load selected period from localStorage or use current period
  const selectedPeriod = localStorage.getItem('selected_period');
  if (selectedPeriod) {
    currentPeriod = selectedPeriod;
  } else {
    const now = new Date();
    currentPeriod = toPeriod(now.getFullYear(), now.getMonth() + 1);
  }
  
  loadStore();
  bindDashboardEvents();
  renderDashboard();
}

function renderDashboard() {
  ensurePeriod(currentPeriod);
  const p = store[currentPeriod];
  document.getElementById('budget-display').textContent = fmt(p.budget + (p.added||0));
  const spent = p.expenses.reduce((s,e)=>s+Number(e.amount||0),0);
  document.getElementById('spent-display').textContent = fmt(spent);
  document.getElementById('remaining-display').textContent = fmt((p.budget + (p.added||0)) - spent);
  
  // Render expense list preview (only show first 5 expenses)
  const expenseListPreview = document.getElementById('expense-list-preview');
  expenseListPreview.innerHTML = '';
  
  if(p.expenses.length === 0){
    expenseListPreview.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <h3 class="text-h3 mb-2">No expenses yet</h3>
        <p class="text-body text-secondary">Add your first expense to get started</p>
      </div>
    `;
  } else {
    // Show only the first 5 expenses
    const recentExpenses = p.expenses.slice().reverse().slice(0, 5);
    recentExpenses.forEach((exp, idx) => {
      const row = document.createElement('div');
      row.className = 'expense-item';
      row.innerHTML = `
        <div class="expense-details">
          <div class="text-body font-medium">${escapeHtml(exp.name||'—')}</div>
          <div class="text-caption text-tertiary">${new Date(exp.timestamp).toLocaleString()}</div>
        </div>
        <div class="expense-actions">
          <div class="text-body font-medium mr-4 text-danger">${fmt(exp.amount)}</div>
        </div>
      `;
      expenseListPreview.appendChild(row);
    });
  }
  
  document.getElementById('current-period').textContent = periodDisplay(currentPeriod);
  saveStore();
}

function bindDashboardEvents() {
  // Period selection events
  document.getElementById('change-period-btn').addEventListener('click', function() {
    window.location.href = 'period-selection.html';
  });
  
  // Back to period selection
  document.getElementById('back-to-period').addEventListener('click', function() {
    window.location.href = 'period-selection.html';
  });
  
  // Modal events
  document.getElementById('add-money-btn').addEventListener('click', function() {
    openAddMoneyModal();
  });
  document.getElementById('add-expense-btn').addEventListener('click', function() {
    openAddExpenseModal();
  });
  
  // Modal submit events
  document.getElementById('submit-add-money').addEventListener('click', function() {
    addMoneyToBudget();
  });
  document.getElementById('submit-add-expense').addEventListener('click', function() {
    addExpense();
  });
  
  // Modal close events
  document.getElementById('close-add-money').addEventListener('click', function() {
    closeAddMoneyModal();
  });
  document.getElementById('close-add-expense').addEventListener('click', function() {
    closeAddExpenseModal();
  });
  
  // Other events
  document.getElementById('export-btn').addEventListener('click', function() {
    exportCSV();
  });
  document.getElementById('prev-month-btn').addEventListener('click', function() {
    shiftMonth(-1);
  });
  document.getElementById('next-month-btn').addEventListener('click', function() {
    shiftMonth(1);
  });
  document.getElementById('today-btn').addEventListener('click', function() {
    const now = new Date();
    currentPeriod = toPeriod(now.getFullYear(), now.getMonth()+1);
    renderDashboard();
  });
  
  // View all expenses
  document.getElementById('view-all-expenses').addEventListener('click', function() {
    window.location.href = 'expenses.html';
  });
  
  // Enter key events
  document.getElementById('add-money-source').addEventListener('keydown', e => { 
    if(e.key === 'Enter') addMoneyToBudget(); 
  });
  
  document.getElementById('add-money-amount').addEventListener('keydown', e => { 
    if(e.key === 'Enter') addMoneyToBudget(); 
  });
  
  document.getElementById('expense-name').addEventListener('keydown', e => { 
    if(e.key === 'Enter') addExpense(); 
  });
  
  document.getElementById('expense-amount').addEventListener('keydown', e => { 
    if(e.key === 'Enter') addExpense(); 
  });
  
  // Close modals when clicking outside
  window.addEventListener('click', (event) => {
    const addMoneyModal = document.getElementById('add-money-modal');
    const addExpenseModal = document.getElementById('add-expense-modal');
    
    if (event.target === addMoneyModal) {
      closeAddMoneyModal();
    }
    
    if (event.target === addExpenseModal) {
      closeAddExpenseModal();
    }
  });
}

// Action functions specific to dashboard
function addMoneyToBudget(){
  const source = document.getElementById('add-money-source').value.trim();
  const amount = Number(document.getElementById('add-money-amount').value);
  
  if(isNaN(amount) || amount <= 0){ 
    alert('Please enter a valid positive amount'); 
    document.getElementById('add-money-amount').focus(); 
    return; 
  }
  
  if(source === ''){ 
    alert('Please specify where the money came from.'); 
    document.getElementById('add-money-source').focus(); 
    return; 
  }
  
  ensurePeriod(currentPeriod);
  const p = store[currentPeriod];
  
  // Initialize income array if it doesn't exist
  if(!p.income) p.income = [];
  
  // Add to income tracking
  p.income.push({ source, amount: Number(amount), timestamp: Date.now() });
  
  // Add to budget
  p.added = (p.added||0) + amount;
  
  // Clear form fields
  document.getElementById('add-money-source').value = '';
  document.getElementById('add-money-amount').value = '';
  
  closeAddMoneyModal();
  saveStore();
  document.getElementById('last-action').textContent = `Added ₹${amount} from ${source}`;
  renderDashboard();
}

function addExpense(){
  const name = document.getElementById('expense-name').value.trim();
  const amount = Number(document.getElementById('expense-amount').value);
  const newBudget = document.getElementById('budget-input').value !== '' ? Number(document.getElementById('budget-input').value) : null;
  
  if(isNaN(amount) || amount <= 0){ 
    alert('Please enter a valid positive amount'); 
    document.getElementById('expense-amount').focus(); 
    return; 
  }
  if(name === ''){ 
    alert('Please give the expense a name.'); 
    document.getElementById('expense-name').focus(); 
    return; 
  }
  
  ensurePeriod(currentPeriod);
  const p = store[currentPeriod];
  if(newBudget !== null){ p.budget = newBudget; document.getElementById('budget-input').value=''; }
  p.expenses.push({ name, amount: Number(amount), timestamp: Date.now() });
  document.getElementById('expense-name').value=''; 
  document.getElementById('expense-amount').value='';
  closeAddExpenseModal();
  saveStore();
  document.getElementById('last-action').textContent = `Added expense: ${name} ₹${amount}`;
  renderDashboard();
}

function exportCSV(){
  ensurePeriod(currentPeriod);
  const p = store[currentPeriod];
  const rows = [['Type','Name','Amount','Timestamp','Date']];
  
  // Add income entries
  if (p.income) {
    p.income.forEach(i => rows.push(['Income', i.source, i.amount, i.timestamp, new Date(i.timestamp).toISOString()]));
  }
  
  // Add expense entries
  p.expenses.forEach(e => rows.push(['Expense', e.name, e.amount, e.timestamp, new Date(e.timestamp).toISOString()]));
  
  const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g,'""') + '"').join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'expenses_' + currentPeriod + '.csv';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  document.getElementById('last-action').textContent = 'Exported CSV';
}

function shiftMonth(delta){ 
  const {year, month} = parsePeriod(currentPeriod); 
  let d = new Date(year, month-1 + delta, 1); 
  currentPeriod = toPeriod(d.getFullYear(), d.getMonth()+1); 
  renderDashboard(); 
}