// ========== Utility Functions ==========
(function () {
  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Safe fallback for crypto.randomUUID() for browser compatibility
  function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    // Fallback implementation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Global category list
  const CATEGORY_LIST = ["Food", "Transport", "Shopping", "Entertainment", "Healthcare", "Education", "Bills", "Other"];

  // Category emojis mapping
  const CATEGORY_EMOJIS = {
    "Food": "🍔",
    "Transport": "🚗",
    "Shopping": "🛍️",
    "Entertainment": "🎬",
    "Healthcare": "🏥",
    "Education": "📚",
    "Bills": "📄",
    "Other": "📦"
  };

  // Income category emojis mapping
  const INCOME_CATEGORY_EMOJIS = {
    "Salary": "💼",
    "Freelance": "💻",
    "Investment": "📈",
    "Gift": "🎁",
    "Other": "📦"
  };

  function toPeriod(y, m) {
    return `${y}-${String(m).padStart(2, "0")}`;
  }

  function parsePeriod(p) {
    const [y, mm] = p.split("-").map(Number);
    return { year: y, month: mm };
  }

  // Get current page name for period key creation
  function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop().replace('.html', '') || 'dashboard';
    // Map to known page names
    const pageMap = {
      'dashboard': 'dashboard',
      'expenses': 'expenses',
      'reports': 'reports',
      'income': 'income',
      'categories': 'categories',
      'goals': 'goals',
      'settings': 'settings',
      'period-selection': 'period_selection'
    };
    return pageMap[page] || 'dashboard';
  }

  function periodDisplay(p) {
    const { year, month } = parsePeriod(p);
    return `${MONTH_NAMES[month - 1]} ${year}`;
  }

  function fmt(n) {
    // Get currency from settings, default to INR
    const currency = (window.store && window.store.settings && window.store.settings.currency) || "INR";
    const locale = currency === "INR" ? "en-IN" : "en-US";

    return Number(n || 0).toLocaleString(locale, {
      style: "currency",
      currency: currency
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]'/g, m => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[m]);
  }

  // ========== Greeting Function ==========
  function getGreeting() {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return "Good Morning";
    } else if (hour >= 12 && hour < 17) {
      return "Good Afternoon";
    } else if (hour >= 17 && hour < 21) {
      return "Good Evening";
    } else {
      return "Good Night";
    }
  }

  function updateGreeting() {
    const greetingElement = document.querySelector('.greeting');
    if (greetingElement) {
      greetingElement.textContent = `${getGreeting()}, User`;
    }
  }

  // ========== Monthly Summary ==========
  // Renamed to avoid collision with reports.js version
  function renderMonthlySummaryUtils(period) {
    // Make sure period is initialized
    if (!period) {
      const page = getCurrentPage();
      const key = `period_${page}`;
      period = localStorage.getItem(key) || toPeriod(new Date().getFullYear(), new Date().getMonth() + 1);
    }

    const p = getPeriodData(period);

    // Calculate total income
    const totalIncome = p.income.reduce((sum, i) => sum + i.amount, 0) + p.budget;

    // Calculate total expenses
    const totalExpenses = p.expenses.reduce((sum, e) => sum + e.amount, 0);

    // Calculate savings
    const totalSavings = totalIncome - totalExpenses;

    // Find biggest expense
    const biggestExpense = p.expenses.length > 0
      ? Math.max(...p.expenses.map(e => e.amount))
      : 0;

    // Count total transactions
    const totalCount = p.income.length + p.expenses.length;

    // Find top category (using actual categories now)
    let topCategory = "None";
    if (p.expenses.length > 0) {
      const categoryCount = {};
      p.expenses.forEach(e => {
        const category = e.category || "Other";
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });
      const maxCategory = Object.entries(categoryCount).reduce((a, b) => a[1] > b[1] ? a : b);
      topCategory = maxCategory[0];
    }

    // Update UI elements if they exist
    const incomeEl = document.getElementById("summary-income");
    const expensesEl = document.getElementById("summary-expenses");
    const savingsEl = document.getElementById("summary-savings");
    const biggestEl = document.getElementById("summary-biggest");
    const countEl = document.getElementById("summary-count");
    const categoryEl = document.getElementById("summary-category");

    if (incomeEl) incomeEl.textContent = fmt(totalIncome);
    if (expensesEl) expensesEl.textContent = fmt(totalExpenses);
    if (savingsEl) savingsEl.textContent = fmt(totalSavings);
    if (biggestEl) biggestEl.textContent = fmt(biggestExpense);
    if (countEl) countEl.textContent = totalCount;
    if (categoryEl) categoryEl.textContent = topCategory;
  }

  // Consistent period initialization across modules
  function initPeriod() {
    // Always start with current month (Today)
    // This overrides any saved history to ensure fresh state on reload
    const currentPeriod = toPeriod(new Date().getFullYear(), new Date().getMonth() + 1);

    // Update storage with current period so other functions stay in sync
    const page = getCurrentPage();
    const key = `period_${page}`;
    localStorage.setItem(key, currentPeriod);

    return currentPeriod;
  }

  // Consistent period navigation across modules
  function navigatePeriod(currentPeriod, delta) {
    const { year, month } = parsePeriod(currentPeriod);
    const d = new Date(year, month - 1 + delta, 1);
    const newPeriod = toPeriod(d.getFullYear(), d.getMonth() + 1);
    // Use page-specific key
    const page = getCurrentPage();
    const key = `period_${page}`;
    localStorage.setItem(key, newPeriod);
    return newPeriod;
  }

  // Populate expense category dropdown
  function populateExpenseCategoryDropdown(selectElement) {
    if (!selectElement) return;

    // Clear existing options except the first one if it's "All Categories"
    const isFirstOptionAll = selectElement.options[0] && selectElement.options[0].value === "all";
    selectElement.innerHTML = isFirstOptionAll ? '<option value="all">All Categories</option>' : '';

    // Add category options
    // Use stored categories if available, otherwise default
    const categories = (window.store && window.store.categories) || CATEGORY_LIST;

    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = `${CATEGORY_EMOJIS[category] || '📦'} ${category}`;
      selectElement.appendChild(option);
    });
  }

  // Populate income category dropdown
  function populateIncomeCategoryDropdown(selectElement) {
    if (!selectElement) return;

    // Clear existing options except the first one if it's "All Categories"
    const isFirstOptionAll = selectElement.options[0] && selectElement.options[0].value === "all";
    selectElement.innerHTML = isFirstOptionAll ? '<option value="all">All Categories</option>' : '';

    // Add category options
    const incomeCategories = ["Salary", "Freelance", "Investment", "Gift", "Other"];
    incomeCategories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = `${INCOME_CATEGORY_EMOJIS[category] || '📦'} ${category}`;
      selectElement.appendChild(option);
    });
  }

  // Export utility functions and constants to global scope
  window.MONTH_NAMES = MONTH_NAMES;
  window.generateUUID = generateUUID;
  window.CATEGORY_LIST = CATEGORY_LIST;
  window.CATEGORY_EMOJIS = CATEGORY_EMOJIS;
  window.INCOME_CATEGORY_EMOJIS = INCOME_CATEGORY_EMOJIS;
  window.toPeriod = toPeriod;
  window.parsePeriod = parsePeriod;
  window.getCurrentPage = getCurrentPage;
  window.periodDisplay = periodDisplay;
  window.fmt = fmt;
  window.escapeHtml = escapeHtml;
  window.getGreeting = getGreeting;
  window.updateGreeting = updateGreeting;
  window.renderMonthlySummaryUtils = renderMonthlySummaryUtils;
  window.initPeriod = initPeriod;
  window.navigatePeriod = navigatePeriod;
  window.populateExpenseCategoryDropdown = populateExpenseCategoryDropdown;
  window.populateIncomeCategoryDropdown = populateIncomeCategoryDropdown;

})();