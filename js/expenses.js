// ========== Expenses ==========
let currentPeriod = "";
let filters = {
  search: "",
  category: "all",
  type: "all",
  minAmount: "",
  maxAmount: ""
};

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
  renderExpenses();
  
  // Update greeting immediately and then every minute
  updateGreeting();
  setInterval(updateGreeting, 60000); // Update every minute
});

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

      window.store.periods[currentPeriod] = {
        budget: 0,
        added: 0,
        expenses: [],
        income: []
      };

      saveStore();
      renderExpenses();
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
  
  // Filter event listeners
  const searchInput = document.getElementById("filter-search");
  const categorySelect = document.getElementById("filter-category");
  const typeSelect = document.getElementById("filter-type");
  const minAmountInput = document.getElementById("filter-min-amount");
  const maxAmountInput = document.getElementById("filter-max-amount");
  const resetBtn = document.getElementById("reset-filters-btn");
  
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      filters.search = e.target.value.toLowerCase();
      renderExpenses();
    });
  }
  
  if (categorySelect) {
    categorySelect.addEventListener("change", (e) => {
      filters.category = e.target.value;
      renderExpenses();
    });
  }
  
  if (typeSelect) {
    typeSelect.addEventListener("change", (e) => {
      filters.type = e.target.value;
      renderExpenses();
    });
  }
  
  if (minAmountInput) {
    minAmountInput.addEventListener("input", (e) => {
      filters.minAmount = e.target.value;
      renderExpenses();
    });
  }
  
  if (maxAmountInput) {
    maxAmountInput.addEventListener("input", (e) => {
      filters.maxAmount = e.target.value;
      renderExpenses();
    });
  }
  
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      filters = {
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
  list.innerHTML = "";

  let all = [
    ...p.income.map((i, index) => ({ ...i, type: "income", index })),
    ...p.expenses.map((e, index) => ({ ...e, type: "expense", index }))
  ];
  
  // Apply filters
  if (filters.search) {
    all = all.filter(t => {
      const name = t.type === "income" ? t.source : t.name;
      return name.toLowerCase().includes(filters.search);
    });
  }
  
  if (filters.category !== "all") {
    all = all.filter(t => (t.category || "Other") === filters.category);
  }
  
  if (filters.type !== "all") {
    all = all.filter(t => t.type === filters.type);
  }
  
  if (filters.minAmount) {
    const min = parseFloat(filters.minAmount);
    if (!isNaN(min)) {
      all = all.filter(t => t.amount >= min);
    }
  }
  
  if (filters.maxAmount) {
    const max = parseFloat(filters.maxAmount);
    if (!isNaN(max)) {
      all = all.filter(t => t.amount <= max);
    }
  }
  
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
      "Other": "📦"
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
          ${category} • ${new Date(t.timestamp).toLocaleString()}
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
    button.addEventListener("click", function() {
      const type = this.getAttribute("data-type");
      const index = parseInt(this.getAttribute("data-index"));
      
      if (confirm(`Are you sure you want to delete this ${type}?`)) {
        if (type === "income") {
          // If deleting income, adjust the added amount
          const deletedIncome = p.income[index];
          p.added -= deletedIncome.amount;
          p.income.splice(index, 1);
        } else {
          p.expenses.splice(index, 1);
        }
        
        saveStore();
        renderExpenses();
      }
    });
  });
  
  saveStore();
}