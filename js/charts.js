// ========== Charts Module ==========
import { initPeriod, fmt, parsePeriod, toPeriod, periodDisplay } from './utils.js';
import { getPeriodData } from './storage.js';

// Store chart instances to destroy them when re-rendering
let chartInstances = {};

function toggleChartPlaceholder(canvasId, showPlaceholder, message = "No data available") {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const container = canvas.parentElement;
  if (!container) return;

  let placeholder = container.querySelector(".chart-empty-placeholder");
  
  if (showPlaceholder) {
    canvas.style.display = "none";
    if (!placeholder) {
      placeholder = document.createElement("div");
      placeholder.className = "chart-empty-placeholder";
      placeholder.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px dashed var(--border-primary);
        border-radius: var(--radius-xl);
        color: var(--text-secondary);
        font-weight: 500;
        text-align: center;
        padding: 20px;
      `;
      placeholder.innerHTML = `
        <div style="font-size: 40px; margin-bottom: 12px;">📊</div>
        <div style="font-size: 15px; font-weight: 600; color: var(--text-primary);">${message}</div>
        <div style="font-size: 12px; color: var(--text-tertiary); margin-top: 4px;">Add transactions to see analytics</div>
      `;
      container.appendChild(placeholder);
    }
  } else {
    canvas.style.display = "block";
    if (placeholder) {
      placeholder.remove();
    }
  }
}

<<<<<<< HEAD
// Returns just the currency symbol for the currently selected currency,
// for compact axis ticks (fmt() would add thousands separators/decimals,
// which is too busy for a Y axis).
function getCurrentCurrencySymbol() {
  const currency = (window.store && window.store.settings && window.store.settings.currency) || "INR";
  const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥' };
  return symbols[currency] || '₹';
}

// True only when the Chart.js library actually loaded. It comes from a
// CDN, so it can legitimately be missing: offline (the PWA caches it, but
// a first visit offline won't have it), a blocked/failed CDN request, or
// a privacy extension. Without this guard `new Chart(...)` throws a
// ReferenceError that propagates out of renderCharts() and aborts the
// whole page initializer — which left the period header stuck on its
// hardcoded placeholder and, much worse, meant the month navigation
// buttons never got bound and silently did nothing.
function isChartLibraryAvailable() {
  return typeof Chart !== "undefined";
}

// Render all charts. Never throws: a charting problem must not be able to
// take down the rest of the page with it.
export function renderCharts(period) {
  if (!period) period = initPeriod();

  if (!isChartLibraryAvailable()) {
    console.warn("Chart.js unavailable — showing chart placeholders.");
    toggleChartPlaceholder('categoryChart', true, "Charts unavailable offline");
    toggleChartPlaceholder('spendingTrendChart', true, "Charts unavailable offline");
    return;
  }

  try {
    renderCategoryPieChart(period);
  } catch (e) {
    console.error("Failed to render category chart:", e);
    toggleChartPlaceholder('categoryChart', true, "Chart could not be displayed");
  }

  try {
    renderSpendingTrendChart(period);
  } catch (e) {
    console.error("Failed to render spending trend chart:", e);
    toggleChartPlaceholder('spendingTrendChart', true, "Chart could not be displayed");
  }
=======
// Render all charts
export function renderCharts(period) {
  if (!period) period = initPeriod();
  renderCategoryPieChart(period);
  renderSpendingTrendChart(period);
>>>>>>> f46d71631115c637724f5b7b342a2629e1f1d80d
}

// Render category pie chart (Doughnut)
export function renderCategoryPieChart(period) {
  if (!period) period = initPeriod();
  const p = getPeriodData(period);
  const ctx = document.getElementById('categoryChart');

  if (!ctx) return;
<<<<<<< HEAD
  if (!isChartLibraryAvailable()) {
    toggleChartPlaceholder('categoryChart', true, "Charts unavailable offline");
    return;
  }
=======
>>>>>>> f46d71631115c637724f5b7b342a2629e1f1d80d

  if (chartInstances.categoryChart) {
    chartInstances.categoryChart.destroy();
  }

  const categoryData = {};
  let totalPeriodExpense = 0;

  // p.expenses is already scoped to `period` (that's what getPeriodData
  // returns it from), so no need to re-derive year/month from each
  // expense's own `date` field and filter on it again here.
  p.expenses.forEach(e => {
    const category = e.category || "Other";
    categoryData[category] = (categoryData[category] || 0) + e.amount;
    totalPeriodExpense += e.amount;
  });

  const labels = Object.keys(categoryData);
  const data = Object.values(categoryData);

  const hasExpenses = totalPeriodExpense > 0;
  if (!hasExpenses) {
    toggleChartPlaceholder('categoryChart', true, "No expenses in this period");
    if (chartInstances.categoryChart) {
      chartInstances.categoryChart.destroy();
      chartInstances.categoryChart = null;
    }
    return;
  } else {
    toggleChartPlaceholder('categoryChart', false);
  }

  chartInstances.categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
          '#EC4899',
          '#14B8A6',
          '#F97316'
        ],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim(),
            font: {
              family: 'Inter',
              size: 12
            },
            padding: 20
          }
        },
        tooltip: {
          backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary').trim(),
          titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim(),
          bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim(),
          borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-primary').trim(),
          borderWidth: 1,
          padding: 12,
          boxPadding: 4,
          usePointStyle: true,
          callbacks: {
            label: function (context) {
              const label = context.label || '';
              const value = context.raw || 0;

              if (label === "No Data") return " No Expenses yet";

              const percentage = totalPeriodExpense > 0
                ? Math.round((value / totalPeriodExpense) * 100)
                : 0;

              return ` ${label}: ${fmt(value)} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

// Render spending trend chart (Income vs Expenses)
export function renderSpendingTrendChart(period) {
  if (!period) period = initPeriod();
  const ctx = document.getElementById('spendingTrendChart');

  if (!ctx) return;
<<<<<<< HEAD
  if (!isChartLibraryAvailable()) {
    toggleChartPlaceholder('spendingTrendChart', true, "Charts unavailable offline");
    return;
  }
=======
>>>>>>> f46d71631115c637724f5b7b342a2629e1f1d80d

  if (chartInstances.spendingTrendChart) {
    chartInstances.spendingTrendChart.destroy();
  }

  const { year, month } = parsePeriod(period);
  const labels = [];
  const expenseData = [];
  const incomeData = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    const periodKey = toPeriod(d.getFullYear(), d.getMonth() + 1);
    labels.push(periodDisplay(periodKey));

    const periodData = window.store.periods && window.store.periods[periodKey];
    if (periodData) {
      // periodData.expenses/income are already scoped to periodKey (that's
      // the bucket they're stored under), so no need to re-derive year/month
      // from each transaction's own `date` field and filter on it again.
      const spending = periodData.expenses
        .reduce((sum, e) => sum + e.amount, 0);

      let totalIncome = periodData.budget || 0;

      if (periodData.income && periodData.income.length > 0) {
        const incomeTransactions = periodData.income
          .reduce((sum, i) => sum + i.amount, 0);

        totalIncome = incomeTransactions;
      } else {
        totalIncome = (periodData.budget || 0) + (periodData.added || 0);
      }

      expenseData.push(spending);
      incomeData.push(totalIncome);

    } else {
      expenseData.push(0);
      incomeData.push(0);
    }
  }

  const hasTrendData = incomeData.some(val => val > 0) || expenseData.some(val => val > 0);
  if (!hasTrendData) {
    toggleChartPlaceholder('spendingTrendChart', true, "No transaction history");
    if (chartInstances.spendingTrendChart) {
      chartInstances.spendingTrendChart.destroy();
      chartInstances.spendingTrendChart = null;
    }
    return;
  } else {
    toggleChartPlaceholder('spendingTrendChart', false);
  }

  chartInstances.spendingTrendChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          backgroundColor: '#22c55e',
          borderRadius: 4,
          barPercentage: 0.6,
          categoryPercentage: 0.8
        },
        {
          label: 'Expenses',
          data: expenseData,
          backgroundColor: '#ef4444',
          borderRadius: 4,
          barPercentage: 0.6,
          categoryPercentage: 0.8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            usePointStyle: true,
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim(),
            font: { family: 'Inter' }
          }
        },
        tooltip: {
          backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary').trim(),
          titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim(),
          bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim(),
          borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-primary').trim(),
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: function (context) {
              return ` ${context.dataset.label}: ${fmt(context.raw)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim(),
            callback: function (value) {
<<<<<<< HEAD
              return getCurrentCurrencySymbol() + value;
=======
              return '₹' + value;
>>>>>>> f46d71631115c637724f5b7b342a2629e1f1d80d
            }
          },
          grid: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--border-primary').trim(),
            borderDash: [5, 5]
          }
        },
        x: {
          ticks: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// Bind to window for global access/compatibility
window.renderCharts = renderCharts;
window.renderCategoryPieChart = renderCategoryPieChart;
window.renderSpendingTrendChart = renderSpendingTrendChart;
