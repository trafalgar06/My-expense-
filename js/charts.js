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
  // Render category pie chart (Doughnut)
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
    let totalPeriodExpense = 0; // Track total for percentage

    p.expenses.forEach(e => {
      const [itemYear, itemMonth] = e.date.split("-");
      if (itemYear === currentYear && itemMonth === currentMonth) {
        const category = e.category || "Other";
        categoryData[category] = (categoryData[category] || 0) + e.amount;
        totalPeriodExpense += e.amount;
      }
    });

    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);

    if (labels.length === 0) {
      labels.push("No Data");
      data.push(1); // Placeholder
    }

    chartInstances.categoryChart = new Chart(ctx, {
      type: 'doughnut', // Modern Look
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            '#3B82F6', // Blue
            '#10B981', // Green
            '#F59E0B', // Amber
            '#EF4444', // Red
            '#8B5CF6', // Purple
            '#EC4899', // Pink
            '#14B8A6', // Teal
            '#F97316'  // Orange
          ],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%', // Thinner ring
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

                // Handle "No Data" case
                if (label === "No Data") return " No Expenses yet";

                // Calculate percentage
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
  };

  // Render spending trend chart
  // Render spending trend chart (Updated to Income vs Expenses)
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
    const expenseData = [];
    const incomeData = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      const periodKey = toPeriod(d.getFullYear(), d.getMonth() + 1);
      labels.push(periodDisplay(periodKey));

      const periodData = window.store.periods && window.store.periods[periodKey];
      if (periodData) {
        const [currentYear, currentMonth] = periodKey.split("-");

        // Calculate Expenses
        const spending = periodData.expenses
          .filter(e => {
            const [itemYear, itemMonth] = e.date.split("-");
            return itemYear === currentYear && itemMonth === currentMonth;
          })
          .reduce((sum, e) => sum + e.amount, 0);

        // Calculate Income (Budget + Additional Income)
        // Adjust logic: If there are income entries, sum them. 
        // We will sum the "Budget" set at start + any explicit "Income" transactions

        let totalIncome = periodData.budget || 0;

        // Add specific income transactions
        if (periodData.income && periodData.income.length > 0) {
          const incomeTransactions = periodData.income
            .filter(i => {
              const [itemYear, itemMonth] = i.date.split("-");
              return itemYear === currentYear && itemMonth === currentMonth;
            })
            .reduce((sum, i) => sum + i.amount, 0);

          // Note: In some logic, 'added' might track this, but explicit list is safer if available
          // Checking if 'added' is redundant with income list. 
          // Based on migration, we rely on income array + initial budget.
          // However, let's use the same logic as Summary (income array sum) ?? 
          // Actually Summary uses income array sum. But 'budget' might be separate.
          // Let's assume Total Income = Income Transactions (which should include 'added' money if modeled correctly).
          // But 'Budget' input usually sets an initial state. 
          // Let's stick to safe logic: Income Array Sum. 
          // Wait, 'budget' is user target. Real income is money in. 
          // Let's match summary logic: Only Income Transactions.

          totalIncome = incomeTransactions;
        } else {
          // Fallback to 'budget' + 'added' if income array is empty (legacy)
          totalIncome = (periodData.budget || 0) + (periodData.added || 0);
        }

        expenseData.push(spending);
        incomeData.push(totalIncome);

      } else {
        expenseData.push(0);
        incomeData.push(0);
      }
    }

    chartInstances.spendingTrendChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Income',
            data: incomeData,
            backgroundColor: '#10B981', // Green
            borderRadius: 4,
            barPercentage: 0.6,
            categoryPercentage: 0.8
          },
          {
            label: 'Expenses',
            data: expenseData,
            backgroundColor: '#EF4444', // Red
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
                return '₹' + value; // Simple formatting for axis
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
