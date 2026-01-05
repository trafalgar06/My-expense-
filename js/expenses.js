// ========== Expenses ==========
(function () {
  let currentPeriod = "";
  let expensesFilters = {
    search: "",
    category: "all",
    type: "all",
    minAmount: "",
    maxAmount: ""
  };

  // DOMContentLoaded listener removed to prevent double initialization.
  // Handled by bootstrap.js

  function bindEvents() {
    const backToDashboardBtn = document.getElementById("back-to-dashboard");
    if (backToDashboardBtn) {
      backToDashboardBtn.addEventListener("click", () => {
        window.location.href = "dashboard.html";
      });
    }

    const clearMonthBtn = document.getElementById("clear-month-btn");
    if (clearMonthBtn) {
      clearMonthBtn.addEventListener("click", () => {
        if (!confirm("Clear all transactions?")) return;

        const p = getPeriodData(currentPeriod);

        // Log audit events for all deleted items
        p.expenses.forEach(expense => {
          if (window.auditLog) {
            window.auditLog.logDeleteExpense(expense);
          }
        });

        p.income.forEach(income => {
          if (window.auditLog) {
            window.auditLog.logDeleteIncome(income);
          }
        });

        window.store.periods[currentPeriod] = {
          budget: 0,
          added: 0,
          expenses: [],
          income: []
        };

        saveStore();
        renderExpenses();
        // Update greeting and check for other global updates
        if (window.updateGreeting) window.updateGreeting();

        const lastAction = document.getElementById("last-action");
        if (lastAction) {
          lastAction.textContent = "🗑️ All data for this month cleared";
          setTimeout(() => {
            lastAction.textContent = "Welcome to Expense Management!";
          }, 3000);
        }
      });
    }

    const prevMonthBtn = document.getElementById("prev-month-btn");
    if (prevMonthBtn) prevMonthBtn.addEventListener("click", () => shift(-1));

    const nextMonthBtn = document.getElementById("next-month-btn");
    if (nextMonthBtn) nextMonthBtn.addEventListener("click", () => shift(1));

    const todayBtn = document.getElementById("today-btn");
    if (todayBtn) {
      todayBtn.addEventListener("click", () => {
        const now = new Date();
        currentPeriod = toPeriod(now.getFullYear(), now.getMonth() + 1);
        // Use page-specific key
        const page = getCurrentPage();
        const key = `period_${page}`;
        localStorage.setItem(key, currentPeriod);
        ensurePeriod(currentPeriod);
        renderExpenses();
      });
    }

    const addExpenseBtn = document.getElementById("add-expense-btn");
    if (addExpenseBtn) {
      addExpenseBtn.addEventListener("click", openAddExpenseModal);
    }

    const addIncomeBtn = document.getElementById("add-income-btn");
    if (addIncomeBtn) {
      addIncomeBtn.addEventListener("click", openAddIncomeModal);
    }

    // Filter event listeners (existing code matches)
    const searchInput = document.getElementById("filter-search");
    // ... rest of the bindings ...
  }

  function openAddExpenseModal() {
    // Get safe date
    const d = new Date();
    const safeDate = d.toLocaleDateString("en-CA"); // YYYY-MM-DD

    // Create modal dynamically
    const modalHTML = `
      <div id="add-expense-modal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="text-h2">Add New Expense</h2>
            <button id="close-add-expense" class="modal-close">&times;</button>
          </div>
          
          <div class="input-group mb-4">
            <label for="expense-name" class="input-label">Expense Name</label>
            <input type="text" id="expense-name" class="input-field" placeholder="What did you buy?">
          </div>
          
          <div class="input-group mb-4">
            <label for="expense-category" class="input-label">Category</label>
            <select id="expense-category" class="input-field">
              <!-- Options will be populated dynamically -->
            </select>
          </div>
          
          <div class="input-group mb-4">
            <label for="expense-amount" class="input-label">Amount</label>
            <input type="number" id="expense-amount" class="input-field" placeholder="How much?">
          </div>
          
          <div class="input-group mb-4">
            <label for="expense-date" class="input-label">Date</label>
            <input type="date" id="expense-date" class="input-field" value="${safeDate}">
          </div>
          
          <button id="submit-add-expense" class="btn btn-primary w-full">
            Add Expense
          </button>
        </div>
      </div>
    `;

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Populate category dropdown
    const expenseCategorySelect = document.getElementById('expense-category');
    if (expenseCategorySelect) {
      populateExpenseCategoryDropdown(expenseCategorySelect);
    }

    // Add event listeners
    document.getElementById("close-add-expense").addEventListener("click", closeAddExpenseModal);
    document.getElementById("submit-add-expense").addEventListener("click", addExpense);

    // Show modal
    document.getElementById("add-expense-modal").style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function closeAddExpenseModal() {
    const modal = document.getElementById("add-expense-modal");
    if (modal) {
      modal.remove();
    }
    document.body.style.overflow = "";
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

    closeAddExpenseModal();
    saveStore();
    renderExpenses();

    // Log the audit event
    if (window.auditLog) {
      window.auditLog.logAddExpense(newExpense);
    }

    // Feedback
    const lastAction = document.getElementById("last-action");
    if (lastAction) {
      lastAction.textContent = `Added expense: ${name} (${fmt(amt)})`;
    }
    const categorySelect = document.getElementById("filter-category");
    const typeSelect = document.getElementById("filter-type");
    const minAmountInput = document.getElementById("filter-min-amount");
    const maxAmountInput = document.getElementById("filter-max-amount");
    const resetBtn = document.getElementById("reset-filters-btn");

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        expensesFilters.search = e.target.value.toLowerCase();
        renderExpenses();
      });
    }

    if (categorySelect) {
      categorySelect.addEventListener("change", (e) => {
        expensesFilters.category = e.target.value;
        renderExpenses();
      });
    }

    if (typeSelect) {
      typeSelect.addEventListener("change", (e) => {
        expensesFilters.type = e.target.value;
        renderExpenses();
      });
    }

    if (minAmountInput) {
      minAmountInput.addEventListener("input", (e) => {
        expensesFilters.minAmount = e.target.value;
        renderExpenses();
      });
    }

    if (maxAmountInput) {
      maxAmountInput.addEventListener("input", (e) => {
        expensesFilters.maxAmount = e.target.value;
        renderExpenses();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        expensesFilters = {
          search: "",
          category: "all",
          type: "all",
          minAmount: "",
          maxAmount: ""
        };
        if (searchInput) searchInput.value = "";
        if (categorySelect) categorySelect.value = "all";
        if (typeSelect) typeSelect.value = "all";
        if (minAmountInput) minAmountInput.value = "";
        if (maxAmountInput) maxAmountInput.value = "";
        renderExpenses();
      });
    }
  }

  function openAddIncomeModal() {
    // Get safe date
    const d = new Date();
    const safeDate = d.toLocaleDateString("en-CA"); // YYYY-MM-DD

    // Create modal dynamically
    const modalHTML = `
      <div id="add-income-modal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="text-h2">Add New Income Source</h2>
            <button id="close-add-income" class="modal-close">&times;</button>
          </div>
          
          <div class="input-group mb-4">
            <label for="income-source" class="input-label">Income Source</label>
            <input type="text" id="income-source" class="input-field" placeholder="Where did you get this money?">
          </div>
          
          <div class="input-group mb-4">
            <label for="income-category" class="input-label">Category</label>
            <select id="income-category" class="input-field">
              <!-- Options will be populated dynamically -->
            </select>
          </div>
          
          <div class="input-group mb-4">
            <label for="income-amount" class="input-label">Amount</label>
            <input type="number" id="income-amount" class="input-field" placeholder="How much?">
          </div>
          
          <div class="input-group mb-4">
            <label for="income-date" class="input-label">Date</label>
            <input type="date" id="income-date" class="input-field" value="${safeDate}">
          </div>
          
          <button id="submit-add-income" class="btn btn-primary w-full">
            Add Income
          </button>
        </div>
      </div>
    `;

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Populate category dropdown
    const incomeCategorySelect = document.getElementById('income-category');
    if (incomeCategorySelect) {
      populateIncomeCategoryDropdown(incomeCategorySelect);
    }

    // Add event listeners
    document.getElementById("close-add-income").addEventListener("click", closeAddIncomeModal);
    document.getElementById("submit-add-income").addEventListener("click", addIncome);

    // Show modal
    document.getElementById("add-income-modal").style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function closeAddIncomeModal() {
    const modal = document.getElementById("add-income-modal");
    if (modal) {
      modal.remove();
    }
    document.body.style.overflow = "";
  }

  function addIncome() {
    const source = document.getElementById("income-source").value.trim();
    const category = document.getElementById("income-category").value;
    const amt = Number(document.getElementById("income-amount").value);
    const dateInput = document.getElementById("income-date");

    if (!source) {
      alert("Please enter the income source");
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

    // Use currentPeriod from closure
    // Note: expenses.js usually gets period from window or closure. 
    // currentPeriod is defined at top of expenses.js.

    const p = getPeriodData(currentPeriod);

    const newIncome = {
      id: generateUUID(),
      source,
      amount: amt,
      category: category || "Other",
      date: selectedDate,
      timestamp: Date.now()
    };

    p.income.push(newIncome);
    p.added += amt;

    closeAddIncomeModal();
    saveStore();
    renderExpenses();

    // Log the audit event
    if (window.auditLog) {
      window.auditLog.logAddIncome(newIncome);
    }

    const lastAction = document.getElementById("last-action");
    if (lastAction) {
      lastAction.textContent = `Added income: ${source}`;
    }
  }

  function shift(delta) {
    // Use consistent period navigation utility function
    currentPeriod = navigatePeriod(currentPeriod, delta);

    ensurePeriod(currentPeriod);
    renderExpenses();
  }

  function renderExpenses() {
    ensurePeriod(currentPeriod);
    const p = getPeriodData(currentPeriod);

    document.getElementById("current-period").textContent = periodDisplay(currentPeriod);

    const list = document.getElementById("expense-list");
    if (!list) return;
    list.innerHTML = "";

    let all = [
      ...p.income.map((i, index) => ({ ...i, type: "income", index })),
      ...p.expenses.map((e, index) => ({ ...e, type: "expense", index }))
    ];

    // Apply filters
    if (expensesFilters.search) {
      all = all.filter(t => {
        const name = t.type === "income" ? t.source : t.name;
        return name.toLowerCase().includes(expensesFilters.search);
      });
    }

    if (expensesFilters.category !== "all") {
      all = all.filter(t => (t.category || "Other") === expensesFilters.category);
    }

    if (expensesFilters.type !== "all") {
      all = all.filter(t => t.type === expensesFilters.type);
    }

    if (expensesFilters.minAmount) {
      const min = parseFloat(expensesFilters.minAmount);
      if (!isNaN(min)) {
        all = all.filter(t => t.amount >= min);
      }
    }

    if (expensesFilters.maxAmount) {
      const max = parseFloat(expensesFilters.maxAmount);
      if (!isNaN(max)) {
        all = all.filter(t => t.amount <= max);
      }
    }

    // CORRECT MONTHLY FILTERING: Filter by date instead of timestamp
    const [currentYear, currentMonth] = currentPeriod.split("-");
    all = all.filter(t => {
      const [itemYear, itemMonth] = t.date.split("-");
      return itemYear === currentYear && itemMonth === currentMonth;
    });

    // Sort by timestamp (newest first)
    all.sort((a, b) => b.timestamp - a.timestamp);

    if (all.length === 0) {
      list.innerHTML = `<div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <h3 class="text-h3 mb-2">No transactions found</h3>
        <p class="text-body text-secondary">Try adjusting your filters or add a new transaction</p>
      </div>`;
      return;
    }

    all.forEach((t) => {
      const row = document.createElement("div");
      row.className = "expense-item";

      const isIncome = t.type === "income";

      // Get category emoji based on category
      const categoryEmojis = {
        "Food": "🍔",
        "Transport": "🚗",
        "Shopping": "🛍️",
        "Entertainment": "🎬",
        "Healthcare": "🏥",
        "Education": "📚",
        "Bills": "📄",
        "Income": "💰",
        "Other": "📦",
        "Salary": "💼",
        "Freelance": "💻",
        "Investment": "📈",
        "Gift": "🎁"
      };

      const category = t.category || "Other";
      const icon = categoryEmojis[category] || "📦";
      const name = isIncome ? t.source : t.name;
      const sign = isIncome ? "+" : "-";
      const amountClass = isIncome ? "text-success" : "text-danger";

      row.innerHTML = `
        <div class="expense-details">
          <div class="text-body font-medium">${icon} ${escapeHtml(name)}</div>
          <div class="text-caption text-tertiary">
            ${category} • ${new Date(t.date).toLocaleDateString()}
          </div>
        </div>
        <div class="expense-actions">
          <div class="text-body font-medium mr-4 ${amountClass}">${sign}${fmt(t.amount)}</div>
          <button class="btn btn-danger btn-sm delete-btn" data-type="${t.type}" data-index="${t.index}">
            Delete
          </button>
        </div>
      `;

      list.appendChild(row);
    });

    // Add event listeners to delete buttons
    document.querySelectorAll(".delete-btn").forEach(button => {
      button.addEventListener("click", function () {
        const type = this.getAttribute("data-type");
        const index = parseInt(this.getAttribute("data-index"));

        if (type === "income") {
          // If deleting income, adjust the added amount
          const deletedIncome = p.income[index];
          p.added -= deletedIncome.amount;
          p.income.splice(index, 1);

          // Log the audit event
          if (window.auditLog) {
            window.auditLog.logDeleteIncome(deletedIncome);
          }
        } else {
          const deletedExpense = p.expenses[index];
          p.expenses.splice(index, 1);

          // Log the audit event
          if (window.auditLog) {
            window.auditLog.logDeleteExpense(deletedExpense);
          }
        }

        saveStore();
        renderExpenses();
      });
    });
  }

  // Export functions that need to be accessible globally
  window.initializeExpensesPage = function () {
    if (document.getElementById('expense-list')) {
      loadStore();
      currentPeriod = initPeriod();
      ensurePeriod(currentPeriod);

      // Populate filter category dropdown
      const filterCategorySelect = document.getElementById('filter-category');
      if (filterCategorySelect) {
        populateExpenseCategoryDropdown(filterCategorySelect);
      }

      bindEvents();
      renderExpenses();
      updateGreeting();
      setInterval(updateGreeting, 60000); // Update every minute
    }
  };

})();