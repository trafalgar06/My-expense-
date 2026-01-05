// ========== Reports Page ----------
(function () {

  // Render monthly summary statistics
  function renderMonthlySummary(period) {
    const p = getPeriodData(period);

    // Get the data for the current period
    const [currentYear, currentMonth] = period.split("-");

    // Filter expenses and income for the current period by date
    const filteredExpenses = p.expenses.filter(e => {
      const [itemYear, itemMonth] = e.date.split("-");
      return itemYear === currentYear && itemMonth === currentMonth;
    });

    const filteredIncome = p.income.filter(i => {
      const [itemYear, itemMonth] = i.date.split("-");
      return itemYear === currentYear && itemMonth === currentMonth;
    });

    // Calculate totals
    const totalIncome = filteredIncome.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalSavings = totalIncome - totalExpenses;

    // Find biggest expense
    const biggestExpense = filteredExpenses.length > 0
      ? Math.max(...filteredExpenses.map(e => e.amount))
      : 0;

    // Total transaction count
    const totalTransactions = filteredExpenses.length + filteredIncome.length;

    // Find top category
    let topCategory = "None";
    if (filteredExpenses.length > 0) {
      const categoryTotals = {};
      filteredExpenses.forEach(e => {
        const category = e.category || "Other";
        categoryTotals[category] = (categoryTotals[category] || 0) + e.amount;
      });

      topCategory = Object.entries(categoryTotals).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    }

    // Update UI elements
    const summaryIncome = document.getElementById("summary-income");
    const summaryExpenses = document.getElementById("summary-expenses");
    const summarySavings = document.getElementById("summary-savings");
    const summaryBiggest = document.getElementById("summary-biggest");
    const summaryCount = document.getElementById("summary-count");
    const summaryCategory = document.getElementById("summary-category");

    if (summaryIncome) summaryIncome.textContent = fmt(totalIncome);
    if (summaryExpenses) summaryExpenses.textContent = fmt(totalExpenses);
    if (summarySavings) {
      summarySavings.textContent = fmt(totalSavings);
      // Change color based on positive/negative savings
      summarySavings.className = `summary-value-premium text-accent ${totalSavings < 0 ? 'text-danger' : 'text-success'}`;
    }
    if (summaryBiggest) summaryBiggest.textContent = fmt(biggestExpense);
    if (summaryCount) summaryCount.textContent = totalTransactions;
    if (summaryCategory) summaryCategory.textContent = topCategory;
  }

  // Initialize page on load
  // DOMContentLoaded listener removed to prevent double initialization
  // report.html calls initializeReportsPage() explicitly

  // Initialize reports page (called from HTML)
  function initializeReportsPage() {
    loadStore();

    // Initialize period using consistent utility function
    const currentPeriod = initPeriod();
    ensurePeriod(currentPeriod);

    // Render summary and charts
    renderMonthlySummary(currentPeriod);

    if (window.renderCharts) {
      window.renderCharts(currentPeriod);
    }

    // Bind event handlers
    bindReportsEvents();
  }

  function bindReportsEvents() {
    const prevMonthBtn = document.getElementById("prev-month-btn");
    if (prevMonthBtn) prevMonthBtn.addEventListener("click", () => shiftMonth(-1));

    const nextMonthBtn = document.getElementById("next-month-btn");
    if (nextMonthBtn) nextMonthBtn.addEventListener("click", () => shiftMonth(1));

    const todayBtn = document.getElementById("today-btn");
    if (todayBtn) {
      todayBtn.addEventListener("click", () => {
        const now = new Date();
        const cp = toPeriod(now.getFullYear(), now.getMonth() + 1);
        const page = getCurrentPage();
        const key = `period_${page}`;
        localStorage.setItem(key, cp);

        ensurePeriod(cp);
        renderMonthlySummary(cp);
        if (window.renderCharts) window.renderCharts(cp);

        // Update display
        const periodDisplay = document.getElementById("current-period");
        if (periodDisplay) periodDisplay.textContent = window.periodDisplay(cp);
      });
    }

    // Update initial period display
    const periodDisplay = document.getElementById("current-period");
    if (periodDisplay) {
      const page = getCurrentPage();
      const key = `period_${page}`;
      const savedPeriod = localStorage.getItem(key);
      if (savedPeriod) {
        periodDisplay.textContent = window.periodDisplay(savedPeriod);
      }
    }
  }

  function shiftMonth(delta) {
    const page = getCurrentPage();
    const key = `period_${page}`;
    let cp = localStorage.getItem(key);
    if (!cp) {
      cp = toPeriod(new Date().getFullYear(), new Date().getMonth() + 1);
    }

    cp = navigatePeriod(cp, delta);
    localStorage.setItem(key, cp);

    ensurePeriod(cp);
    renderMonthlySummary(cp);
    if (window.renderCharts) window.renderCharts(cp);

    const periodDisplay = document.getElementById("current-period");
    if (periodDisplay) {
      periodDisplay.textContent = window.periodDisplay(cp);
    }
  }

  // Export functions that need to be accessible globally
  window.initializeReportsPage = initializeReportsPage;
  window.renderMonthlySummary = renderMonthlySummary;
  window.bindReportsEvents = bindReportsEvents;
  window.shiftMonth = shiftMonth;
})();