// ===== Modal Functions =====
function openAddMoneyModal() {
  document.getElementById('add-money-modal').style.display = 'flex';
  document.getElementById('add-money-source').focus();
}

function closeAddMoneyModal() {
  document.getElementById('add-money-modal').style.display = 'none';
  document.getElementById('add-money-source').value = '';
  document.getElementById('add-money-amount').value = '';
}

function openAddExpenseModal() {
  document.getElementById('add-expense-modal').style.display = 'flex';
  document.getElementById('expense-name').focus();
}

function closeAddExpenseModal() {
  document.getElementById('add-expense-modal').style.display = 'none';
  document.getElementById('expense-name').value = '';
  document.getElementById('expense-amount').value = '';
}