// ========== Dashboard ==========
(function () {
  let currentPeriod = "";
  let editingExpenseIndex = null;
  let editingIncomeIndex = null;

  // Export functions that need to be accessible globally
  window.initializeDashboard = function () {
    // Initialize the dashboard when needed
    if (document.getElementById('budget-display')) {
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

      // Populate expense category dropdown
      const expenseCategorySelect = document.getElementById("expense-category");
      if (expenseCategorySelect) {
        populateExpenseCategoryDropdown(expenseCategorySelect);
      }

      renderDashboard();
      renderCharts(currentPeriod);
      updateGreeting();
    }
  };

  function bindEvents() {
    const changePeriodBtn = document.getElementById("change-period-btn");
    if (changePeriodBtn) {
      changePeriodBtn.addEventListener("click", () => {
        window.location.href = "period-selection.html";
      });
    }

    const exportBtn = document.getElementById("export-btn");
    if (exportBtn) exportBtn.addEventListener("click", exportToCSV);

    const setBudgetBtn = document.getElementById("set-budget-btn");
    if (setBudgetBtn) setBudgetBtn.addEventListener("click", setMainBudget);

    const addMoneyBtn = document.getElementById("add-money-btn");
    if (addMoneyBtn) addMoneyBtn.addEventListener("click", openMoneyModal);

    const addExpenseBtn = document.getElementById("add-expense-btn");
    if (addExpenseBtn) addExpenseBtn.addEventListener("click", openExpenseModal);

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
      });
    }

    const viewAllExpensesBtn = document.getElementById("view-all-expenses");
    if (viewAllExpensesBtn) {
      viewAllExpensesBtn.addEventListener("click", () => {
        window.location.href = "expenses.html";
      });
    }

    // Add Enter key support for budget input
    const budgetInput = document.getElementById("budget-input");
    if (budgetInput) {
      budgetInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          setMainBudget();
        }
      });
    }
  }

  function renderDashboard() {
    ensurePeriod(currentPeriod);
    const p = getPeriodData(currentPeriod);

    const spent = p.expenses.reduce((sum, e) => sum + e.amount, 0);

    document.getElementById("budget-display").textContent = fmt(p.budget + p.added);
    document.getElementById("spent-display").textContent = fmt(spent);
    document.getElementById("remaining-display").textContent =
      fmt(p.budget + p.added - spent);

    document.getElementById("current-period").textContent = periodDisplay(currentPeriod);

    // Update greeting based on time of day
    updateGreeting();

    const list = document.getElementById("expense-list-preview");
    list.innerHTML = "";

    // Combine income and expenses for recent transactions
    const allTransactions = [
      ...p.income.map(i => ({ ...i, type: "income" })),
      ...p.expenses.map(e => ({ ...e, type: "expense" }))
    ].sort((a, b) => b.timestamp - a.timestamp);

    // Show only the first 5 transactions
    allTransactions
      .slice(0, 5)
      .forEach((transaction) => {
        const row = document.createElement("div");
        row.className = "expense-item";

        const isIncome = transaction.type === "income";
        const icon = isIncome ? "💰" : "🛒";
        const name = isIncome ? transaction.source : transaction.name;

        row.innerHTML = `
        <div>
          <div class="text-body font-medium">${icon} ${escapeHtml(name)}</div>
          <div class="text-caption">${new Date(transaction.date).toLocaleDateString()}</div>
        </div>
        <div class="${isIncome ? 'text-success' : 'text-danger'}">
          <strong>${isIncome ? '+' : '-'}${fmt(transaction.amount)}</strong>
        </div>`;
        list.appendChild(row);
      });

  }

  function setMainBudget() {
    const budgetInput = document.getElementById("budget-input");
    const budgetAmount = Number(budgetInput.value);

    if (isNaN(budgetAmount) || budgetAmount < 0) {
      alert("Please enter a valid budget amount");
      return;
    }

    const p = getPeriodData(currentPeriod);
    const oldBudget = p.budget;
    p.budget = budgetAmount;

    budgetInput.value = "";
    saveStore();
    renderDashboard();

    // Log the audit event
    if (window.auditLog) {
      window.auditLog.logBudgetUpdate(oldBudget, budgetAmount);
    }

    document.getElementById("last-action").textContent = `Main budget set to ${fmt(budgetAmount)}`;
  }

  function addExtraIncome() {
    const src = document.getElementById("add-money-source").value.trim();
    const amt = Number(document.getElementById("add-money-amount").value);
    const dateInput = document.getElementById("add-money-date");

    if (!src) {
      alert("Please enter the source of the income");
      return;
    }

    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const p = getPeriodData(currentPeriod);

    // Get safe date
    const d = new Date();
    const safeDate = d.toLocaleDateString("en-CA"); // YYYY-MM-DD
    const selectedDate = dateInput && dateInput.value ? dateInput.value : safeDate;

    const newIncome = {
      id: generateUUID(),
      source: src,
      amount: amt,
      category: "Income",
      date: selectedDate,
      timestamp: Date.now()
    };

    p.income.push(newIncome);
    p.added += amt;

    document.getElementById("add-money-source").value = "";
    document.getElementById("add-money-amount").value = "";
    if (dateInput) dateInput.value = safeDate;

    closeMoneyModal();
    saveStore();
    renderDashboard();

    // Log the audit event
    if (window.auditLog) {
      window.auditLog.logAddIncome(newIncome);
    }


  }

  function addExpense() {
    const name = document.getElementById("expense-name").value.trim();
    const category = document.getElementById("expense-category").value;
    const amt = Number(document.getElementById("expense-amount").value);
    const dateInput = document.getElementById("expense-date");

    if (!name) {
      alert("Please enter the expense name");
      return;
    }

    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    // Get safe date
    const d = new Date();
    const safeDate = d.toLocaleDateString("en-CA"); // YYYY-MM-DD
    const selectedDate = dateInput && dateInput.value ? dateInput.value : safeDate;

    const newExpense = {
      id: generateUUID(),
      name,
      amount: amt,
      category: category || "Other",
      date: selectedDate,
      timestamp: Date.now()
    };

    getPeriodData(currentPeriod).expenses.push(newExpense);

    document.getElementById("expense-name").value = "";
    document.getElementById("expense-category").value = "Food";
    document.getElementById("expense-amount").value = "";
    if (dateInput) dateInput.value = safeDate;

    closeExpenseModal();
    saveStore();
    renderDashboard();
    renderMonthlySummaryUtils(currentPeriod);
    renderCharts(currentPeriod);

    // Log the audit event
    if (window.auditLog) {
      window.auditLog.logAddExpense(newExpense);
    }


  }

  function shiftMonth(delta) {
    // Use consistent period navigation utility function
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

    // Prepare CSV data
    let csv = "Date,Type,Description,Category,Amount\n";

    // Add income entries
    p.income.forEach(item => {
      const date = new Date(item.date).toLocaleDateString();
      const description = item.source.replace(/,/g, ';'); // Escape commas
      const category = (item.category || "Income").replace(/,/g, ';');
      csv += `"${date}","Income","${description}","${category}",${item.amount}\n`;
    });

    // Add expense entries
    p.expenses.forEach(item => {
      const date = new Date(item.date).toLocaleDateString();
      const description = item.name.replace(/,/g, ';'); // Escape commas
      const category = (item.category || "Other").replace(/,/g, ';');
      csv += `"${date}","Expense","${description}","${category}",${item.amount}\n`;
    });

    // Add summary
    const totalIncome = p.budget + p.added;
    const totalExpenses = p.expenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = totalIncome - totalExpenses;

    csv += "\n";
    csv += `"Summary","Budget","${periodDisplay(currentPeriod)}","",${p.budget}\n`;
    csv += `"Summary","Extra Income","${periodDisplay(currentPeriod)}","",${p.added}\n`;
    csv += `"Summary","Total Budget","${periodDisplay(currentPeriod)}","",${totalIncome}\n`;
    csv += `"Summary","Total Expenses","${periodDisplay(currentPeriod)}","",${totalExpenses}\n`;
    csv += `"Summary","Remaining","${periodDisplay(currentPeriod)}","",${remaining}\n`;

    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `DenaroTrack_${currentPeriod}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    document.getElementById("last-action").textContent = `Exported data for ${periodDisplay(currentPeriod)}`;
  }

  // ========== Edit Functions ==========
  function openEditExpenseModal(index) {
    editingExpenseIndex = index;
    const expense = getPeriodData(currentPeriod).expenses[index];

    document.getElementById("edit-expense-name").value = expense.name;

    // Populate category dropdown
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
    document.getElementById("edit-expense-modal").style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  // Edit modals are handled in modal.js

  function updateExpense() {
    if (editingExpenseIndex === null) return;

    const name = document.getElementById("edit-expense-name").value.trim();
    const category = document.getElementById("edit-expense-category").value;
    const amt = Number(document.getElementById("edit-expense-amount").value);
    const dateInput = document.getElementById("edit-expense-date");

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

    // Get safe date
    const d = new Date();
    const safeDate = d.toLocaleDateString("en-CA"); // YYYY-MM-DD
    const selectedDate = dateInput && dateInput.value ? dateInput.value : (oldExpense.date || safeDate);

    const newExpense = {
      id: oldExpense.id || generateUUID(),
      name,
      amount: amt,
      category: category || "Other",
      date: selectedDate,
      timestamp: oldExpense.timestamp
    };

    p.expenses[editingExpenseIndex] = newExpense;

    closeEditExpenseModal();
    saveStore();
    renderDashboard();
    renderMonthlySummaryUtils();
    renderCharts();

    // Log the audit event
    if (window.auditLog) {
      window.auditLog.logEditExpense(oldExpense, newExpense);
    }

    document.getElementById("last-action").textContent = `Updated expense: ${name}`;
  }

  function openEditIncomeModal(index) {
    editingIncomeIndex = index;
    const income = getPeriodData(currentPeriod).income[index];

    document.getElementById("edit-income-source").value = income.source;
    document.getElementById("edit-income-amount").value = income.amount;
    const editDateInput = document.getElementById("edit-income-date");
    if (editDateInput) editDateInput.value = income.date;
    document.getElementById("edit-income-modal").style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function updateIncome() {
    if (editingIncomeIndex === null) return;

    const source = document.getElementById("edit-income-source").value.trim();
    const amt = Number(document.getElementById("edit-income-amount").value);
    const dateInput = document.getElementById("edit-income-date");

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

    // Get safe date
    const d = new Date();
    const safeDate = d.toLocaleDateString("en-CA"); // YYYY-MM-DD
    const selectedDate = dateInput && dateInput.value ? dateInput.value : (oldIncome.date || safeDate);

    const newIncome = {
      id: oldIncome.id || generateUUID(),
      source,
      amount: amt,
      category: oldIncome.category || "Income",
      date: selectedDate,
      timestamp: oldIncome.timestamp
    };

    p.income[editingIncomeIndex] = newIncome;

    // Update the added amount
    p.added = p.added - oldAmount + amt;

    closeEditIncomeModal();
    saveStore();
    renderDashboard();
    renderMonthlySummaryUtils();
    renderCharts();

    // Log the audit event
    if (window.auditLog) {
      window.auditLog.logEditIncome(oldIncome, newIncome);
    }

    document.getElementById("last-action").textContent = `Updated income: ${source}`;
  }

})();