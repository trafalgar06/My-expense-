// ========== Reports Page ----------
import { loadStore, ensurePeriod, getPeriodData } from './storage.js';
import { initPeriod, navigatePeriod, periodDisplay, fmt, toPeriod, getCurrentPage } from './utils.js';
import { renderCharts } from './charts.js';

// Render monthly summary statistics
export function renderMonthlySummary(period) {
  const p = getPeriodData(period);

  // No extra date-based re-filter here: p.expenses/p.income are already
  // scoped to `period` by definition of where they're stored, so summing
  // them directly is correct even if an individual transaction's `date`
  // field doesn't exactly match the period it's filed under.
  const filteredExpenses = p.expenses;
  const filteredIncome = p.income;

  const totalIncome = filteredIncome.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalSavings = totalIncome - totalExpenses;

  const biggestExpense = filteredExpenses.length > 0
    ? Math.max(...filteredExpenses.map(e => e.amount))
    : 0;

  const totalTransactions = filteredExpenses.length + filteredIncome.length;

  let topCategory = "None";
  if (filteredExpenses.length > 0) {
    const categoryTotals = {};
    filteredExpenses.forEach(e => {
      const category = e.category || "Other";
      categoryTotals[category] = (categoryTotals[category] || 0) + e.amount;
    });

    topCategory = Object.entries(categoryTotals).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  }

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
    summarySavings.className = `summary-value-premium text-accent ${totalSavings < 0 ? 'text-danger' : 'text-success'}`;
  }
  if (summaryBiggest) summaryBiggest.textContent = fmt(biggestExpense);
  if (summaryCount) summaryCount.textContent = totalTransactions;
  if (summaryCategory) summaryCategory.textContent = topCategory;
}

// Initialize reports page
export function initializeReportsPage() {
  loadStore();

  const currentPeriod = initPeriod();
  ensurePeriod(currentPeriod);

  renderMonthlySummary(currentPeriod);
  renderCharts(currentPeriod);

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
      renderCharts(cp);

      const periodDisplayEl = document.getElementById("current-period");
      if (periodDisplayEl) periodDisplayEl.textContent = periodDisplay(cp);
    });
  }

  const periodDisplayEl = document.getElementById("current-period");
  if (periodDisplayEl) {
    const page = getCurrentPage();
    const key = `period_${page}`;
    const savedPeriod = localStorage.getItem(key);
    if (savedPeriod) {
      periodDisplayEl.textContent = periodDisplay(savedPeriod);
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
  renderCharts(cp);

  const periodDisplayEl = document.getElementById("current-period");
  if (periodDisplayEl) {
    periodDisplayEl.textContent = periodDisplay(cp);
  }
}

// Export functions that need to be accessible globally
window.initializeReportsPage = initializeReportsPage;
window.renderMonthlySummary = renderMonthlySummary;
window.bindReportsEvents = bindReportsEvents;
window.shiftMonth = shiftMonth;