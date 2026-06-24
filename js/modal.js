// ========== Modal Functions =========
import { getDefaultDateForPeriod } from './utils.js';

export function openMoneyModal() {
  const dateInput = document.getElementById("add-money-date");
  if (dateInput) {
    dateInput.value = getDefaultDateForPeriod();
  }
  document.getElementById("add-money-modal").style.display = "flex";
  document.body.style.overflow = "hidden";
}

export function closeMoneyModal() {
  document.getElementById("add-money-modal").style.display = "none";
  document.body.style.overflow = "";
}

export function openExpenseModal() {
  const dateInput = document.getElementById("expense-date");
  if (dateInput) {
    dateInput.value = getDefaultDateForPeriod();
  }
  document.getElementById("add-expense-modal").style.display = "flex";
  document.body.style.overflow = "hidden";
}

export function closeExpenseModal() {
  document.getElementById("add-expense-modal").style.display = "none";
  document.body.style.overflow = "";
}

export function closeEditExpenseModal() {
  const modal = document.getElementById("edit-expense-modal");
  if (modal) {
    modal.style.display = "none";
    document.body.style.overflow = "";
  }
  if (typeof window.editingExpenseIndex !== 'undefined') {
    window.editingExpenseIndex = null;
  }
}

export function closeEditIncomeModal() {
  const modal = document.getElementById("edit-income-modal");
  if (modal) {
    modal.style.display = "none";
    document.body.style.overflow = "";
  }
  if (typeof window.editingIncomeIndex !== 'undefined') {
    window.editingIncomeIndex = null;
  }
}

// Export functions that need to be accessible globally
window.openMoneyModal = openMoneyModal;
window.closeMoneyModal = closeMoneyModal;
window.openExpenseModal = openExpenseModal;
window.closeExpenseModal = closeExpenseModal;
window.closeEditExpenseModal = closeEditExpenseModal;
window.closeEditIncomeModal = closeEditIncomeModal;