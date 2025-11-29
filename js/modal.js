// ========== Modal Functions ==========
function openMoneyModal() {
  document.getElementById("add-money-modal").style.display = "flex";
}
function closeMoneyModal() {
  document.getElementById("add-money-modal").style.display = "none";
}

function openExpenseModal() {
  document.getElementById("add-expense-modal").style.display = "flex";
}
function closeExpenseModal() {
  document.getElementById("add-expense-modal").style.display = "none";
}

function closeEditExpenseModal() {
  const modal = document.getElementById("edit-expense-modal");
  if (modal) modal.style.display = "none";
}

function closeEditIncomeModal() {
  const modal = document.getElementById("edit-income-modal");
  if (modal) modal.style.display = "none";
}
