// ========== Dashboard ==========
let currentPeriod = "";
let chartInstances = {};
let editingExpenseIndex = null;
let editingIncomeIndex = null;

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

document.addEventListener("DOMContentLoaded", () => {
  loadStore();

  // Initialize period using consistent utility function
  currentPeriod = initPeriod();

  ensurePeriod(currentPeriod);
  bindEvents();
  renderDashboard();
  
  // Update greeting immediately and then every minute
  updateGreeting();
  setInterval(updateGreeting, 60000); // Update every minute
});

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
          <div class="text-caption">${new Date(transaction.timestamp).toLocaleString()}</div>
        </div>
        <div class="${isIncome ? 'text-success' : 'text-danger'}">
          <strong>${isIncome ? '+' : '-'}${fmt(transaction.amount)}</strong>
        </div>`;
      list.appendChild(row);
    });

  saveStore();
}

function setMainBudget() {
  const budgetInput = document.getElementById("budget-input");
  const budgetAmount = Number(budgetInput.value);
  
  if (isNaN(budgetAmount) || budgetAmount < 0) {
    alert("Please enter a valid budget amount");
    return;
  }
  
  const p = getPeriodData(currentPeriod);
  p.budget = budgetAmount;
  
  budgetInput.value = "";
  saveStore();
  renderDashboard();
  
  document.getElementById("last-action").textContent = `Main budget set to ${fmt(budgetAmount)}`;
}

function addExtraIncome() {
  const src = document.getElementById("add-money-source").value.trim();
  const amt = Number(document.getElementById("add-money-amount").value);

  if (!src) {
    alert("Please enter the source of the income");
    return;
  }
  
  if (isNaN(amt) || amt <= 0) {
    alert("Please enter a valid amount");
    return;
  }

  const p = getPeriodData(currentPeriod);

  p.income.push({ 
    id: crypto.randomUUID(),
    source: src, 
    amount: amt, 
    category: "Income",
    date: new Date().toISOString().split('T')[0],
    timestamp: Date.now() 
  });
  p.added += amt;

  document.getElementById("add-money-source").value = "";
  document.getElementById("add-money-amount").value = "";
  
  closeMoneyModal();
  saveStore();
  renderDashboard();
  
  document.getElementById("last-action").textContent = `Added extra income: ${fmt(amt)} from ${src}`;
}

function addExpense() {
  const name = document.getElementById("expense-name").value.trim();
  const category = document.getElementById("expense-category").value;
  const amt = Number(document.getElementById("expense-amount").value);

  if (!name) {
    alert("Please enter the expense name");
    return;
  }
  
  if (isNaN(amt) || amt <= 0) {
    alert("Please enter a valid amount");
    return;
  }

  getPeriodData(currentPeriod).expenses.push({
    id: crypto.randomUUID(),
    name,
    amount: amt,
    category: category || "Other",
    date: new Date().toISOString().split('T')[0],
    timestamp: Date.now()
  });

  document.getElementById("expense-name").value = "";
  document.getElementById("expense-category").value = "Food";
  document.getElementById("expense-amount").value = "";
  
  closeExpenseModal();
  saveStore();
  renderDashboard();
  renderMonthlySummary();
  renderCharts();
  
  document.getElementById("last-action").textContent = `Added expense: ${name} ${fmt(amt)}`;
}

function shiftMonth(delta) {
  // Use consistent period navigation utility function
  currentPeriod = navigatePeriod(currentPeriod, delta);
  
  ensurePeriod(currentPeriod);
  renderDashboard();
  renderMonthlySummary();
  renderCharts();
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
    const date = new Date(item.timestamp).toLocaleString();
    const description = item.source.replace(/,/g, ';'); // Escape commas
    const category = (item.category || "Income").replace(/,/g, ';');
    csv += `"${date}","Income","${description}","${category}",${item.amount}\n`;
  });
  
  // Add expense entries
  p.expenses.forEach(item => {
    const date = new Date(item.timestamp).toLocaleString();
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

// ========== Monthly Summary ==========
function renderMonthlySummary(period = currentPeriod) {
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
  
  // Update UI
  document.getElementById("summary-income").textContent = fmt(totalIncome);
  document.getElementById("summary-expenses").textContent = fmt(totalExpenses);
  document.getElementById("summary-savings").textContent = fmt(totalSavings);
  document.getElementById("summary-biggest").textContent = fmt(biggestExpense);
  document.getElementById("summary-count").textContent = totalCount;
  document.getElementById("summary-category").textContent = topCategory;
}

// ========== Charts Rendering ==========
function renderCharts(period = currentPeriod) {
  renderCategoryPieChart(period);
  renderSpendingTrendChart(period);
  renderSavingsTrendChart(period);
}

function renderCategoryPieChart(period = currentPeriod) {
  const p = getPeriodData(period);
  const ctx = document.getElementById('categoryChart');
  
  // Destroy existing chart if it exists
  if (chartInstances.categoryChart) {
    chartInstances.categoryChart.destroy();
  }
  
  // Group expenses by category
  const categoryData = {};
  p.expenses.forEach(e => {
    const category = e.category || "Other";
    categoryData[category] = (categoryData[category] || 0) + e.amount;
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
      maintainAspectRatio: true,
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
}

function renderSpendingTrendChart(period = currentPeriod) {
  const ctx = document.getElementById('spendingTrendChart');
  
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
    const period = toPeriod(d.getFullYear(), d.getMonth() + 1);
    labels.push(periodDisplay(period));
    
    const periodData = window.store.periods && window.store.periods[period];
    const spending = periodData ? periodData.expenses.reduce((sum, e) => sum + e.amount, 0) : 0;
    data.push(spending);
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
      maintainAspectRatio: true,
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
}

function renderSavingsTrendChart() {
  const ctx = document.getElementById('savingsTrendChart');
  
  // Destroy existing chart
  if (chartInstances.savingsTrendChart) {
    chartInstances.savingsTrendChart.destroy();
  }
  
  // Get last 6 months data
  const { year, month } = parsePeriod(currentPeriod);
  const labels = [];
  const data = [];
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    const period = toPeriod(d.getFullYear(), d.getMonth() + 1);
    labels.push(periodDisplay(period));
    
    const periodData = window.store.periods && window.store.periods[period];
    if (periodData) {
      const income = periodData.budget + periodData.added;
      const expenses = periodData.expenses.reduce((sum, e) => sum + e.amount, 0);
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
      maintainAspectRatio: true,
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
}

// ========== Edit Functions ==========
function openEditExpenseModal(index) {
  editingExpenseIndex = index;
  const expense = getPeriodData(currentPeriod).expenses[index];
  
  document.getElementById("edit-expense-name").value = expense.name;
  document.getElementById("edit-expense-category").value = expense.category || "Other";
  document.getElementById("edit-expense-amount").value = expense.amount;
  document.getElementById("edit-expense-modal").style.display = "flex";
}

function closeEditExpenseModal() {
  document.getElementById("edit-expense-modal").style.display = "none";
  editingExpenseIndex = null;
}

function updateExpense() {
  if (editingExpenseIndex === null) return;
  
  const name = document.getElementById("edit-expense-name").value.trim();
  const category = document.getElementById("edit-expense-category").value;
  const amt = Number(document.getElementById("edit-expense-amount").value);
  
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
  
  p.expenses[editingExpenseIndex] = {
    id: oldExpense.id || crypto.randomUUID(),
    name,
    amount: amt,
    category: category || "Other",
    date: oldExpense.date || new Date().toISOString().split('T')[0],
    timestamp: oldExpense.timestamp
  };
  
  closeEditExpenseModal();
  saveStore();
  renderDashboard();
  renderMonthlySummary();
  renderCharts();
  
  document.getElementById("last-action").textContent = `Updated expense: ${name}`;
}

function openEditIncomeModal(index) {
  editingIncomeIndex = index;
  const income = getPeriodData(currentPeriod).income[index];
  
  document.getElementById("edit-income-source").value = income.source;
  document.getElementById("edit-income-amount").value = income.amount;
  document.getElementById("edit-income-modal").style.display = "flex";
}

function closeEditIncomeModal() {
  document.getElementById("edit-income-modal").style.display = "none";
  editingIncomeIndex = null;
}

function updateIncome() {
  if (editingIncomeIndex === null) return;
  
  const source = document.getElementById("edit-income-source").value.trim();
  const amt = Number(document.getElementById("edit-income-amount").value);
  
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
  
  p.income[editingIncomeIndex] = {
    id: oldIncome.id || crypto.randomUUID(),
    source,
    amount: amt,
    category: oldIncome.category || "Income",
    date: oldIncome.date || new Date().toISOString().split('T')[0],
    timestamp: oldIncome.timestamp
  };
  
  // Update the added amount
  p.added = p.added - oldAmount + amt;
  
  closeEditIncomeModal();
  saveStore();
  renderDashboard();
  renderMonthlySummary();
  renderCharts();
  
  document.getElementById("last-action").textContent = `Updated income: ${source}`;
}