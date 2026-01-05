// ========== Modal Functions =========
(function() {

function openMoneyModal() {
  document.getElementById("add-money-modal").style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeMoneyModal() {
  document.getElementById("add-money-modal").style.display = "none";
  document.body.style.overflow = "";
}

function openExpenseModal() {
  document.getElementById("add-expense-modal").style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeExpenseModal() {
  document.getElementById("add-expense-modal").style.display = "none";
  document.body.style.overflow = "";
}

function closeEditExpenseModal() {
  const modal = document.getElementById("edit-expense-modal");
  if (modal) {
    modal.style.display = "none";
    document.body.style.overflow = "";
  }
  // Reset editing index (defined in respective page files)
  if (typeof editingExpenseIndex !== 'undefined') {
    editingExpenseIndex = null;
  }
}

function closeEditIncomeModal() {
  const modal = document.getElementById("edit-income-modal");
  if (modal) {
    modal.style.display = "none";
    document.body.style.overflow = "";
  }
  // Reset editing index (defined in respective page files)
  if (typeof editingIncomeIndex !== 'undefined') {
    editingIncomeIndex = null;
  }
}

// Export functions that need to be accessible globally
window.openMoneyModal = openMoneyModal;
window.closeMoneyModal = closeMoneyModal;
window.openExpenseModal = openExpenseModal;
window.closeExpenseModal = closeExpenseModal;
window.closeEditExpenseModal = closeEditExpenseModal;
window.closeEditIncomeModal = closeEditIncomeModal;

})();