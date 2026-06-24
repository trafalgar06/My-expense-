// ========== Dashboard ==========
import { loadStore, ensurePeriod, getPeriodData, saveStore, getAccountBalance, adjustAccountBalance, recordTransfer, reconcileCash } from './storage.js';
import { initPeriod, navigatePeriod, periodDisplay, fmt, escapeHtml, updateGreeting, populateExpenseCategoryDropdown, renderMonthlySummaryUtils, generateUUID, normalizeDate, safeJSONParse, getDefaultDateForPeriod } from './utils.js';
import { renderCharts } from './charts.js';
import { openMoneyModal, closeMoneyModal, openExpenseModal, closeExpenseModal, closeEditExpenseModal, closeEditIncomeModal } from './modal.js';

let currentPeriod = "";
let editingExpenseIndex = null;
let editingIncomeIndex = null;

// Export functions that need to be accessible globally
export function initializeDashboard() {
  if (document.getElementById('income-display')) {
    loadStore();
    currentPeriod = initPeriod();
    ensurePeriod(currentPeriod);
    bindEvents();

    const d = new Date();
    const safeDate = d.toLocaleDateString("en-CA");

    const addMoneyDate = document.getElementById("add-money-date");
    const expenseDate = document.getElementById("expense-date");

    if (addMoneyDate) addMoneyDate.value = safeDate;
    if (expenseDate) expenseDate.value = safeDate;

    const expenseCategorySelect = document.getElementById("expense-category");
    if (expenseCategorySelect) {
      populateExpenseCategoryDropdown(expenseCategorySelect);
    }

    renderDashboard();
    renderCharts(currentPeriod);
    updateGreeting();
  }
}

function bindEvents() {
  const exportBtn = document.getElementById("export-btn");
  if (exportBtn) exportBtn.addEventListener("click", exportToCSV);

  const addMoneyBtn = document.getElementById("add-money-btn");
  if (addMoneyBtn) addMoneyBtn.addEventListener("click", openMoneyModal);

  const addExpenseBtn = document.getElementById("add-expense-btn");
  if (addExpenseBtn) addExpenseBtn.addEventListener("click", openExpenseModal);

  const addMoneyRecurring = document.getElementById("add-money-recurring");
  const addMoneyFrequencyGroup = document.getElementById("add-money-frequency-group");
  if (addMoneyRecurring && addMoneyFrequencyGroup) {
    addMoneyRecurring.addEventListener("change", function() {
      addMoneyFrequencyGroup.style.display = this.checked ? "block" : "none";
    });
  }

  const expenseRecurring = document.getElementById("expense-recurring");
  const expenseFrequencyGroup = document.getElementById("expense-frequency-group");
  if (expenseRecurring && expenseFrequencyGroup) {
    expenseRecurring.addEventListener("change", function() {
      expenseFrequencyGroup.style.display = this.checked ? "block" : "none";
    });
  }

  const closeAddMoneyBtn = document.getElementById("close-add-money");
  if (closeAddMoneyBtn) closeAddMoneyBtn.addEventListener("click", closeMoneyModal);

  const closeAddExpenseBtn = document.getElementById("close-add-expense");
  if (closeAddExpenseBtn) closeAddExpenseBtn.addEventListener("click", closeExpenseModal);

  const closeEditExpenseBtn = document.getElementById("close-edit-expense");
  if (closeEditExpenseBtn) closeEditExpenseBtn.addEventListener("click", closeEditExpenseModal);

  const closeEditIncomeBtn = document.getElementById("close-edit-income");
  if (closeEditIncomeBtn) closeEditIncomeBtn.addEventListener("click", closeEditIncomeModal);

  const submitAddMoneyBtn = document.getElementById("submit-add-money");
  if (submitAddMoneyBtn) submitAddMoneyBtn.addEventListener("click", addExtraIncome);

  const submitAddExpenseBtn = document.getElementById("submit-add-expense");
  if (submitAddExpenseBtn) submitAddExpenseBtn.addEventListener("click", addExpense);

  const submitEditExpenseBtn = document.getElementById("submit-edit-expense");
  if (submitEditExpenseBtn) submitEditExpenseBtn.addEventListener("click", updateExpense);

  const submitEditIncomeBtn = document.getElementById("submit-edit-income");
  if (submitEditIncomeBtn) submitEditIncomeBtn.addEventListener("click", updateIncome);

  const prevMonthBtn = document.getElementById("prev-month-btn");
  if (prevMonthBtn) prevMonthBtn.addEventListener("click", () => shiftMonth(-1));

  const nextMonthBtn = document.getElementById("next-month-btn");
  if (nextMonthBtn) nextMonthBtn.addEventListener("click", () => shiftMonth(1));

  const todayBtn = document.getElementById("today-btn");
  if (todayBtn) {
    todayBtn.addEventListener("click", () => {
      const now = new Date();
      currentPeriod = toPeriod(now.getFullYear(), now.getMonth() + 1);
      ensurePeriod(currentPeriod);
      renderDashboard();
      renderMonthlySummaryUtils(currentPeriod);
      renderCharts(currentPeriod);
    });
  }

  const viewAllExpensesBtn = document.getElementById("view-all-expenses");
  if (viewAllExpensesBtn) {
    viewAllExpensesBtn.addEventListener("click", () => {
      window.location.href = "expenses.html";
    });
  }

  const transferBtn = document.getElementById("transfer-money-btn");
  if (transferBtn) transferBtn.addEventListener("click", openTransferModal);

  const closeTransferBtn = document.getElementById("close-transfer-money");
  if (closeTransferBtn) closeTransferBtn.addEventListener("click", closeTransferModal);

  const submitTransferBtn = document.getElementById("submit-transfer");
  if (submitTransferBtn) submitTransferBtn.addEventListener("click", submitTransfer);

  const reconcileBtn = document.getElementById("reconcile-cash-btn");
  if (reconcileBtn) reconcileBtn.addEventListener("click", openReconcileModal);

  const closeReconcileBtn = document.getElementById("close-reconcile-cash");
  if (closeReconcileBtn) closeReconcileBtn.addEventListener("click", closeReconcileModal);

  const submitReconcileBtn = document.getElementById("submit-reconcile-cash");
  if (submitReconcileBtn) submitReconcileBtn.addEventListener("click", submitReconcile);
}

function openTransferModal() {
  const errorEl = document.getElementById("transfer-error");
  if (errorEl) errorEl.style.display = "none";
  document.getElementById("transfer-amount").value = "";
  document.getElementById("transfer-note").value = "";
  document.getElementById("transfer-from-account").value = "bank";
  document.getElementById("transfer-to-account").value = "cash";
  document.getElementById("transfer-money-modal").style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeTransferModal() {
  document.getElementById("transfer-money-modal").style.display = "none";
  document.body.style.overflow = "";
}

function submitTransfer() {
  const fromAccount = document.getElementById("transfer-from-account").value;
  const toAccount = document.getElementById("transfer-to-account").value;
  const amount = Number(document.getElementById("transfer-amount").value);
  const note = document.getElementById("transfer-note").value.trim();
  const errorEl = document.getElementById("transfer-error");

  if (fromAccount === toAccount) {
    errorEl.textContent = "From and To accounts must be different.";
    errorEl.style.display = "block";
    return;
  }

  if (isNaN(amount) || amount <= 0) {
    errorEl.textContent = "Please enter a valid amount.";
    errorEl.style.display = "block";
    return;
  }

  const result = recordTransfer(fromAccount, toAccount, amount, note);

  if (!result.success) {
    errorEl.textContent = result.error === "Insufficient balance in source account"
      ? "Not enough balance in the source account for this transfer."
      : result.error;
    errorEl.style.display = "block";
    return;
  }

  closeTransferModal();
  renderDashboard();
}

function openReconcileModal() {
  const errorEl = document.getElementById("reconcile-error");
  const successEl = document.getElementById("reconcile-success");
  if (errorEl) errorEl.style.display = "none";
  if (successEl) successEl.style.display = "none";
  document.getElementById("reconcile-cash-amount").value = getAccountBalance("cash");
  document.getElementById("reconcile-cash-modal").style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeReconcileModal() {
  document.getElementById("reconcile-cash-modal").style.display = "none";
  document.body.style.overflow = "";
}

function submitReconcile() {
  const amount = Number(document.getElementById("reconcile-cash-amount").value);
  const errorEl = document.getElementById("reconcile-error");
  const successEl = document.getElementById("reconcile-success");

  if (isNaN(amount) || amount < 0) {
    errorEl.textContent = "Please enter a valid amount.";
    errorEl.style.display = "block";
    successEl.style.display = "none";
    return;
  }

  const result = reconcileCash(amount);

  if (!result.success) {
    errorEl.textContent = result.error;
    errorEl.style.display = "block";
    successEl.style.display = "none";
    return;
  }

  errorEl.style.display = "none";
  const diff = result.difference;
  const diffText = diff === 0
    ? "No adjustment needed."
    : `(adjusted by ${diff > 0 ? '+' : ''}${fmt(diff)})`;
  successEl.textContent = `Cash balance updated to ${fmt(amount)} ${diffText}`;
  successEl.style.display = "block";

  renderDashboard();
}

// Returns what the combined Bank + Cash balance was at the END of the
// month before targetPeriod, by taking the CURRENT combined balance and
// subtracting every bank/cash income and expense that happened in every
// period from targetPeriod onward (i.e. "undoing" everything up to the
// start of targetPeriod). This is accurate because account balances are
// cumulative running totals, not reset per period.
function getLastMonthSpendableTotal(targetPeriod) {
  const currentTotal = getAccountBalance("bank") + getAccountBalance("cash");

  let runningTotal = currentTotal;
  const periods = window.store.periods || {};

  Object.keys(periods)
    .filter(periodKey => periodKey >= targetPeriod)
    .forEach(periodKey => {
      const pData = periods[periodKey];
      (pData.income || []).forEach(i => {
        if ((i.account || "bank") !== "savings") {
          runningTotal -= i.amount;
        }
      });
      (pData.expenses || []).forEach(e => {
        if ((e.account || "bank") !== "savings") {
          runningTotal += e.amount;
        }
      });
    });

  return runningTotal;
}

function renderCategoryLimits() {
  const progressContainer = document.getElementById("category-limits-progress");
  if (!progressContainer) return;

  const limits = safeJSONParse("categoryLimits", {});
  const categoriesWithLimits = Object.keys(limits);

  if (categoriesWithLimits.length === 0) {
    progressContainer.innerHTML = `
      <div class="empty-state" style="padding: var(--space-4) 0;">
        <p class="text-body text-secondary" style="font-size: 13px;">No limits configured. Set them in Settings.</p>
      </div>
    `;
    return;
  }

  progressContainer.innerHTML = "";
  const p = getPeriodData(currentPeriod);

  categoriesWithLimits.forEach(cat => {
    const limit = limits[cat];
    const spent = (p.expenses || [])
      .filter(e => e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0);

    const percent = Math.min(100, Math.round((spent / limit) * 100));
    const emoji = window.getCategoryEmoji ? window.getCategoryEmoji(cat) : "📦";

    let barColor = "var(--success, #10b981)";
    if (percent > 80) {
      barColor = "var(--danger, #ef4444)";
    } else if (percent >= 60) {
      barColor = "var(--warning, #f59e0b)";
    }

    const row = document.createElement("div");
    row.className = "category-limit-row";
    row.style.marginBottom = "var(--space-3)";
    row.innerHTML = `
      <div class="flex justify-between items-center mb-1 text-body-sm" style="display: flex; justify-content: space-between; align-items: center; font-size: 13px;">
        <div class="flex items-center gap-2" style="display: flex; align-items: center; gap: 8px;">
          <span>${escapeHtml(emoji)}</span>
          <span class="font-medium">${escapeHtml(cat)}</span>
        </div>
        <div>
          <span class="font-semibold">${fmt(spent)}</span>
          <span class="text-secondary">/ ${fmt(limit)}</span>
        </div>
      </div>
      <div class="progress-bar-bg" style="width: 100%; height: 8px; background-color: var(--border-primary); border-radius: 4px; overflow: hidden; position: relative; margin-top: 4px;">
        <div class="progress-bar-fill" style="width: ${percent}%; height: 100%; background-color: ${barColor}; border-radius: 4px; transition: width 0.3s ease;"></div>
      </div>
      <div class="text-right text-caption mt-1" style="text-align: right; font-size: 11px; margin-top: 2px; color: ${percent > 80 ? 'var(--danger)' : percent >= 60 ? 'var(--warning)' : 'var(--success)'}; font-weight: ${percent >= 60 ? '600' : 'normal'};">
        ${percent}% Spent${percent > 80 ? ' ⚠️ High spending!' : percent >= 60 ? ' ⚠️ Warning!' : ''}
      </div>
    `;
    progressContainer.appendChild(row);
  });
}

function renderDashboard() {
  ensurePeriod(currentPeriod);
  const p = getPeriodData(currentPeriod);

  const spent = p.expenses.reduce((sum, e) => sum + e.amount, 0);
  const income = p.income.reduce((sum, i) => sum + i.amount, 0);
  const spendableNow = getAccountBalance("bank") + getAccountBalance("cash");

  const incomeEl = document.getElementById("income-display");
  if (incomeEl) {
    incomeEl.textContent = fmt(income);
  }
  document.getElementById("spent-display").textContent = fmt(spent);
  document.getElementById("remaining-display").textContent = fmt(spendableNow);

  const bankEl = document.getElementById("account-bank-display");
  if (bankEl) bankEl.textContent = fmt(getAccountBalance("bank"));

  const cashEl = document.getElementById("account-cash-display");
  if (cashEl) cashEl.textContent = fmt(getAccountBalance("cash"));

  const savingsEl = document.getElementById("account-savings-display");
  if (savingsEl) savingsEl.textContent = fmt(getAccountBalance("savings"));

  document.getElementById("current-period").textContent = periodDisplay(currentPeriod);
  updateGreeting();

  const list = document.getElementById("expense-list-preview");
  list.innerHTML = "";

  const allTransactions = [
    ...p.income.map((i, idx) => ({ ...i, type: "income", originalIndex: idx })),
    ...p.expenses.map((e, idx) => ({ ...e, type: "expense", originalIndex: idx }))
  ].sort((a, b) => b.timestamp - a.timestamp);

  allTransactions
    .slice(0, 5)
    .forEach((transaction) => {
      const row = document.createElement("div");
      row.className = "expense-item recent-transaction-row";

      const isIncome = transaction.type === "income";
      const icon = isIncome 
        ? (transaction.source === "Salary" ? "💼" : transaction.source === "Freelance" ? "💻" : transaction.source === "Investment" ? "📈" : transaction.source === "Gift" ? "🎁" : "💰") 
        : (window.getCategoryEmoji ? window.getCategoryEmoji(transaction.category) : "🛒");
      const name = isIncome ? transaction.source : transaction.name;

      const isRecurring = !!transaction.recurringTemplateId;
      const accountIcon = transaction.account === "cash" ? "💵" : transaction.account === "savings" ? "🐖" : "🏦";
      const accountLabel = transaction.account === "cash" ? "Cash" : transaction.account === "savings" ? "Savings" : "Bank / Online";
      row.innerHTML = `
      <div class="recent-transaction-info">
        <div class="text-body font-medium">${escapeHtml(icon)} ${escapeHtml(name)}${isRecurring ? ' 🔁' : ''} <span title="${accountLabel}" style="font-size: 0.85em;">${accountIcon}</span></div>
        <div class="text-caption">${new Date(transaction.date).toLocaleDateString()}</div>
      </div>
      <div class="recent-transaction-actions">
        <div class="${isIncome ? 'text-success' : 'text-danger'}">
          <strong>${isIncome ? '+' : '-'}${fmt(transaction.amount)}</strong>
        </div>
        <button class="btn btn-secondary btn-sm recent-edit-btn" data-type="${transaction.type}" data-index="${transaction.originalIndex}" title="Edit">✏️</button>
      </div>`;

      const editBtn = row.querySelector(".recent-edit-btn");
      if (editBtn) {
        editBtn.addEventListener("click", () => {
          if (transaction.type === "income") {
            openEditIncomeModal(transaction.originalIndex);
          } else {
            openEditExpenseModal(transaction.originalIndex);
          }
        });
      }

      list.appendChild(row);
    });

  renderCategoryLimits();
}

function addExtraIncome() {
  const src = document.getElementById("add-money-source").value.trim();
  const amt = Number(document.getElementById("add-money-amount").value);
  const dateInput = document.getElementById("add-money-date");
  const accountInput = document.getElementById("add-money-account");
  const account = accountInput ? accountInput.value : "bank";

  if (!src) {
    alert("Please enter the source of the income");
    return;
  }

  if (isNaN(amt) || amt <= 0) {
    alert("Please enter a valid amount");
    return;
  }

  const p = getPeriodData(currentPeriod);
  const defaultDate = getDefaultDateForPeriod();
  const selectedDate = dateInput && dateInput.value ? dateInput.value : defaultDate;

  const recurringCheckbox = document.getElementById("add-money-recurring");
  const isRecurring = recurringCheckbox ? recurringCheckbox.checked : false;
  const frequencySelect = document.getElementById("add-money-frequency");
  const frequency = isRecurring && frequencySelect ? frequencySelect.value : "";

  let templateId = "";
  if (isRecurring) {
    templateId = generateUUID();
    const templates = safeJSONParse("recurringTransactions", []);
    templates.push({
      id: templateId,
      type: "income",
      name: src,
      category: "Income",
      amount: amt,
      frequency: frequency,
      startDate: selectedDate,
      account: account
    });
    localStorage.setItem("recurringTransactions", JSON.stringify(templates));
  }

  // The transaction always belongs to the period currently being viewed —
  // not whatever period the date string happens to fall into. This keeps
  // what you see on screen and what actually gets written in sync.
  const targetDate = normalizeDate(selectedDate) || defaultDate;

  const newIncome = {
    id: generateUUID(),
    source: src,
    amount: amt,
    category: "Income",
    date: targetDate,
    timestamp: Date.now(),
    recurringTemplateId: templateId,
    account: account
  };

  p.income.push(newIncome);
  p.added += amt;
  adjustAccountBalance(account, amt);

  document.getElementById("add-money-source").value = "";
  document.getElementById("add-money-amount").value = "";
  if (dateInput) dateInput.value = defaultDate;
  if (recurringCheckbox) recurringCheckbox.checked = false;
  const addMoneyFrequencyGroup = document.getElementById("add-money-frequency-group");
  if (addMoneyFrequencyGroup) addMoneyFrequencyGroup.style.display = "none";
  const accountSelect = document.getElementById("add-money-account");
  if (accountSelect) accountSelect.value = "bank";

  closeMoneyModal();
  saveStore();
  renderDashboard();

  if (window.auditLog) {
    window.auditLog.logAddIncome(newIncome);
  }
}

function addExpense() {
  const name = document.getElementById("expense-name").value.trim();
  const category = document.getElementById("expense-category").value;
  const amt = Number(document.getElementById("expense-amount").value);
  const dateInput = document.getElementById("expense-date");
  const accountInput = document.getElementById("expense-account");
  const account = accountInput ? accountInput.value : "bank";

  if (!name) {
    alert("Please enter the expense name");
    return;
  }

  if (isNaN(amt) || amt <= 0) {
    alert("Please enter a valid amount");
    return;
  }

  const defaultDate = getDefaultDateForPeriod();
  const selectedDate = dateInput && dateInput.value ? dateInput.value : defaultDate;

  const recurringCheckbox = document.getElementById("expense-recurring");
  const isRecurring = recurringCheckbox ? recurringCheckbox.checked : false;
  const frequencySelect = document.getElementById("expense-frequency");
  const frequency = isRecurring && frequencySelect ? frequencySelect.value : "";

  let templateId = "";
  if (isRecurring) {
    templateId = generateUUID();
    const templates = safeJSONParse("recurringTransactions", []);
    templates.push({
      id: templateId,
      type: "expense",
      name: name,
      category: category || "Other",
      amount: amt,
      frequency: frequency,
      startDate: selectedDate,
      account: account
    });
    localStorage.setItem("recurringTransactions", JSON.stringify(templates));
  }

  // The transaction always belongs to the period currently being viewed —
  // not whatever period the date string happens to fall into. This keeps
  // what you see on screen and what actually gets written in sync, even
  // if the date field is backdated/postdated within reason.
  const targetDate = normalizeDate(selectedDate) || defaultDate;

  const newExpense = {
    id: generateUUID(),
    name,
    amount: amt,
    category: category || "Other",
    date: targetDate,
    timestamp: Date.now(),
    recurringTemplateId: templateId,
    account: account
  };

  getPeriodData(currentPeriod).expenses.push(newExpense);
  adjustAccountBalance(account, -amt);

  document.getElementById("expense-name").value = "";
  document.getElementById("expense-category").value = "Food";
  document.getElementById("expense-amount").value = "";
  if (dateInput) dateInput.value = defaultDate;
  if (recurringCheckbox) recurringCheckbox.checked = false;
  const expenseFrequencyGroup = document.getElementById("expense-frequency-group");
  if (expenseFrequencyGroup) expenseFrequencyGroup.style.display = "none";
  const accountSelect = document.getElementById("expense-account");
  if (accountSelect) accountSelect.value = "bank";

  closeExpenseModal();
  saveStore();
  renderDashboard();
  renderMonthlySummaryUtils(currentPeriod);
  renderCharts(currentPeriod);

  if (window.auditLog) {
    window.auditLog.logAddExpense(newExpense);
  }
}

function shiftMonth(delta) {
  currentPeriod = navigatePeriod(currentPeriod, delta);
  ensurePeriod(currentPeriod);
  renderDashboard();
  renderMonthlySummaryUtils(currentPeriod);
  renderCharts(currentPeriod);
}

function exportToCSV() {
  const p = getPeriodData(currentPeriod);
  if (!p || (p.expenses.length === 0 && p.income.length === 0)) {
    alert("No data to export for this period");
    return;
  }

  let csv = "Date,Type,Description,Category,Amount\n";

  p.income.forEach(item => {
    const date = new Date(item.date).toLocaleDateString();
    const description = item.source.replace(/,/g, ';');
    const category = (item.category || "Income").replace(/,/g, ';');
    csv += `"${date}","Income","${description}","${category}",${item.amount}\n`;
  });

  p.expenses.forEach(item => {
    const date = new Date(item.date).toLocaleDateString();
    const description = item.name.replace(/,/g, ';');
    const category = (item.category || "Other").replace(/,/g, ';');
    csv += `"${date}","Expense","${description}","${category}",${item.amount}\n`;
  });

  const totalIncome = p.income.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = p.expenses.reduce((sum, e) => sum + e.amount, 0);
  const spendableNow = getAccountBalance("bank") + getAccountBalance("cash");

  csv += "\n";
  csv += `"Summary","Total Income","${periodDisplay(currentPeriod)}","",${totalIncome}\n`;
  csv += `"Summary","Total Expenses","${periodDisplay(currentPeriod)}","",${totalExpenses}\n`;
  csv += `"Summary","Bank + Cash (current)","${periodDisplay(currentPeriod)}","",${spendableNow}\n`;
  csv += `"Summary","Savings (current)","${periodDisplay(currentPeriod)}","",${getAccountBalance("savings")}\n`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `DenaroTrack_${currentPeriod}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function openEditExpenseModal(index) {
  editingExpenseIndex = index;
  const expense = getPeriodData(currentPeriod).expenses[index];

  document.getElementById("edit-expense-name").value = expense.name;

  const editCategorySelect = document.getElementById("edit-expense-category");
  if (editCategorySelect) {
    populateExpenseCategoryDropdown(editCategorySelect);
    editCategorySelect.value = expense.category || "Other";
  } else {
    document.getElementById("edit-expense-category").value = expense.category || "Other";
  }

  document.getElementById("edit-expense-amount").value = expense.amount;
  const editDateInput = document.getElementById("edit-expense-date");
  if (editDateInput) editDateInput.value = expense.date;
  const editAccountInput = document.getElementById("edit-expense-account");
  if (editAccountInput) editAccountInput.value = expense.account || "bank";
  document.getElementById("edit-expense-modal").style.display = "flex";
  document.body.style.overflow = "hidden";
}

function updateExpense() {
  if (editingExpenseIndex === null) return;

  const name = document.getElementById("edit-expense-name").value.trim();
  const category = document.getElementById("edit-expense-category").value;
  const amt = Number(document.getElementById("edit-expense-amount").value);
  const dateInput = document.getElementById("edit-edit-expense-date") || document.getElementById("edit-expense-date");
  const accountInput = document.getElementById("edit-expense-account");

  if (!name) {
    alert("Please enter the expense name");
    return;
  }

  if (isNaN(amt) || amt <= 0) {
    alert("Please enter a valid amount");
    return;
  }

  const p = getPeriodData(currentPeriod);
  const oldExpense = p.expenses[editingExpenseIndex];
  const oldAccount = oldExpense.account || "bank";
  const newAccount = accountInput ? accountInput.value : oldAccount;

  const d = new Date();
  const safeDate = d.toLocaleDateString("en-CA");
  const selectedDate = dateInput && dateInput.value ? dateInput.value : (oldExpense.date || safeDate);

  const targetDate = normalizeDate(selectedDate);
  const targetPeriod = targetDate.substring(0, 7); // YYYY-MM

  const newExpense = {
    id: oldExpense.id || generateUUID(),
    name,
    amount: amt,
    category: category || "Other",
    date: targetDate,
    timestamp: oldExpense.timestamp,
    account: newAccount
  };

  if (targetPeriod === currentPeriod) {
    p.expenses[editingExpenseIndex] = newExpense;
  } else {
    p.expenses.splice(editingExpenseIndex, 1);
    getPeriodData(targetPeriod).expenses.push(newExpense);
  }

  // Reverse the old account's deduction, then apply the new one.
  // Handles both "same account, different amount" and "account changed" cases correctly.
  adjustAccountBalance(oldAccount, oldExpense.amount);
  adjustAccountBalance(newAccount, -amt);

  closeEditExpenseModal();
  saveStore();
  renderDashboard();
  renderMonthlySummaryUtils(currentPeriod);
  renderCharts(currentPeriod);

  if (window.auditLog) {
    window.auditLog.logEditExpense(oldExpense, newExpense);
  }
}

function openEditIncomeModal(index) {
  editingIncomeIndex = index;
  const income = getPeriodData(currentPeriod).income[index];

  document.getElementById("edit-income-source").value = income.source;
  document.getElementById("edit-income-amount").value = income.amount;
  const editDateInput = document.getElementById("edit-income-date");
  if (editDateInput) editDateInput.value = income.date;
  const editAccountInput = document.getElementById("edit-income-account");
  if (editAccountInput) editAccountInput.value = income.account || "bank";
  document.getElementById("edit-income-modal").style.display = "flex";
  document.body.style.overflow = "hidden";
}

function updateIncome() {
  if (editingIncomeIndex === null) return;

  const source = document.getElementById("edit-income-source").value.trim();
  const amt = Number(document.getElementById("edit-income-amount").value);
  const dateInput = document.getElementById("edit-income-date");
  const accountInput = document.getElementById("edit-income-account");

  if (!source) {
    alert("Please enter the income source");
    return;
  }

  if (isNaN(amt) || amt <= 0) {
    alert("Please enter a valid amount");
    return;
  }

  const p = getPeriodData(currentPeriod);
  const oldIncome = p.income[editingIncomeIndex];
  const oldAmount = oldIncome.amount;
  const oldAccount = oldIncome.account || "bank";
  const newAccount = accountInput ? accountInput.value : oldAccount;

  const d = new Date();
  const safeDate = d.toLocaleDateString("en-CA");
  const selectedDate = dateInput && dateInput.value ? dateInput.value : (oldIncome.date || safeDate);

  const targetDate = normalizeDate(selectedDate);
  const targetPeriod = targetDate.substring(0, 7); // YYYY-MM

  const newIncome = {
    id: oldIncome.id || generateUUID(),
    source,
    amount: amt,
    category: oldIncome.category || "Income",
    date: targetDate,
    timestamp: oldIncome.timestamp,
    account: newAccount
  };

  if (targetPeriod === currentPeriod) {
    p.income[editingIncomeIndex] = newIncome;
    p.added = p.added - oldAmount + amt;
  } else {
    p.income.splice(editingIncomeIndex, 1);
    p.added = p.added - oldAmount;
    
    const pTarget = getPeriodData(targetPeriod);
    pTarget.income.push(newIncome);
    pTarget.added += amt;
  }

  // Reverse the old account's addition, then apply the new one.
  adjustAccountBalance(oldAccount, -oldAmount);
  adjustAccountBalance(newAccount, amt);

  closeEditIncomeModal();
  saveStore();
  renderDashboard();
  renderMonthlySummaryUtils(currentPeriod);
  renderCharts(currentPeriod);

  if (window.auditLog) {
    window.auditLog.logEditIncome(oldIncome, newIncome);
  }
}

// Bind to window for global access/compatibility
window.initializeDashboard = initializeDashboard;
window.getLastMonthSpendableTotal = getLastMonthSpendableTotal;
window.openEditExpenseModal = openEditExpenseModal;
window.openEditIncomeModal = openEditIncomeModal;
window.editingExpenseIndex = editingExpenseIndex;
window.editingIncomeIndex = editingIncomeIndex;