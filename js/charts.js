// ========== Charts Module ==========
(function () {
  // Store chart instances to destroy them when re-rendering
  let chartInstances = {};

  // Render all charts
  window.renderCharts = function (period) {
    if (!period) period = initPeriod();
    renderCategoryPieChart(period);
    renderSpendingTrendChart(period);
    renderSavingsTrendChart(period);
  };

  // Render category pie chart
  window.renderCategoryPieChart = function (period) {
    if (!period) period = initPeriod();
    const p = getPeriodData(period);
    const ctx = document.getElementById('categoryChart');

    // Check if canvas exists before trying to render
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (chartInstances.categoryChart) {
      chartInstances.categoryChart.destroy();
    }

    // Group expenses by category
    const categoryData = {};
    const [currentYear, currentMonth] = period.split("-");
    p.expenses.forEach(e => {
      const [itemYear, itemMonth] = e.date.split("-");
      if (itemYear === currentYear && itemMonth === currentMonth) {
        const category = e.category || "Other";
        categoryData[category] = (categoryData[category] || 0) + e.amount;
      }
    });

    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);

    if (labels.length === 0) {
      labels.push("No Data");
      data.push(1);
    }

    chartInstances.categoryChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
            '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim(),
              font: {
                family: 'Inter'
              }
            }
          }
        }
      }
    });
  };

  // Render spending trend chart
  window.renderSpendingTrendChart = function (period) {
    if (!period) period = initPeriod();
    const ctx = document.getElementById('spendingTrendChart');

    // Check if canvas exists before trying to render
    if (!ctx) return;

    // Destroy existing chart
    if (chartInstances.spendingTrendChart) {
      chartInstances.spendingTrendChart.destroy();
    }

    // Get last 6 months data
    const { year, month } = parsePeriod(period);
    const labels = [];
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      const periodKey = toPeriod(d.getFullYear(), d.getMonth() + 1);
      labels.push(periodDisplay(periodKey));

      const periodData = window.store.periods && window.store.periods[periodKey];
      if (periodData) {
        const [currentYear, currentMonth] = periodKey.split("-");
        const spending = periodData.expenses
          .filter(e => {
            const [itemYear, itemMonth] = e.date.split("-");
            return itemYear === currentYear && itemMonth === currentMonth;
          })
          .reduce((sum, e) => sum + e.amount, 0);
        data.push(spending);
      } else {
        data.push(0);
      }
    }

    chartInstances.spendingTrendChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Total Spending',
          data: data,
          backgroundColor: '#EF4444',
          borderColor: '#DC2626',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim(),
              font: { family: 'Inter' }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()
            },
            grid: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--border-primary').trim()
            }
          },
          x: {
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()
            },
            grid: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--border-primary').trim()
            }
          }
        }
      }
    });
  };

  // Render savings trend chart
  window.renderSavingsTrendChart = function (period) {
    if (!period) period = initPeriod();
    const ctx = document.getElementById('savingsTrendChart');

    // Check if canvas exists before trying to render
    if (!ctx) return;

    // Destroy existing chart
    if (chartInstances.savingsTrendChart) {
      chartInstances.savingsTrendChart.destroy();
    }

    // Get last 6 months data
    const { year, month } = parsePeriod(period);
    const labels = [];
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      const periodKey = toPeriod(d.getFullYear(), d.getMonth() + 1);
      labels.push(periodDisplay(periodKey));

      const periodData = window.store.periods && window.store.periods[periodKey];
      if (periodData) {
        const [currentYear, currentMonth] = periodKey.split("-");
        const income = periodData.budget + periodData.added;
        const expenses = periodData.expenses
          .filter(e => {
            const [itemYear, itemMonth] = e.date.split("-");
            return itemYear === currentYear && itemMonth === currentMonth;
          })
          .reduce((sum, e) => sum + e.amount, 0);
        const savings = income - expenses;
        data.push(savings);
      } else {
        data.push(0);
      }
    }

    chartInstances.savingsTrendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Savings',
          data: data,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim(),
              font: { family: 'Inter' }
            }
          }
        },
        scales: {
          y: {
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()
            },
            grid: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--border-primary').trim()
            }
          },
          x: {
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()
            },
            grid: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--border-primary').trim()
            }
          }
        }
      }
    });
  };
})();
