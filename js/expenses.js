// ========== Expenses ==========
let currentPeriod = "";

document.addEventListener("DOMContentLoaded", () => {
  loadStore();
  currentPeriod = localStorage.getItem("selected_period") || toPeriod(new Date().getFullYear(), new Date().getMonth() + 1);
  ensurePeriod(currentPeriod);

  bindEvents();
  renderExpenses();
});

function bindEvents() {
  document.getElementById("back-to-dashboard").onclick = () => {
    window.location.href = "dashboard.html";
  };

  document.getElementById("clear-month-btn").onclick = () => {
    if (!confirm("Clear all transactions?")) return;

    store[currentPeriod] = {
      budget: 0,
      added: 0,
      expenses: [],
      income: []
    };

    saveStore();
    renderExpenses();
  };

  document.getElementById("prev-month-btn").onclick = () => shift(-1);
  document.getElementById("next-month-btn").onclick = () => shift(1);
  document.getElementById("today-btn").onclick = () => {
    const now = new Date();
    currentPeriod = toPeriod(now.getFullYear(), now.getMonth() + 1);
    ensurePeriod(currentPeriod);
    renderExpenses();
  };
}

function shift(delta) {
  const { year, month } = parsePeriod(currentPeriod);
  const d = new Date(year, month - 1 + delta, 1);
  currentPeriod = toPeriod(d.getFullYear(), d.getMonth() + 1);

  ensurePeriod(currentPeriod);
  renderExpenses();
}

function renderExpenses() {
  ensurePeriod(currentPeriod);
  const p = store[currentPeriod];

  document.getElementById("current-period").textContent = periodDisplay(currentPeriod);

  const list = document.getElementById("expense-list");
  list.innerHTML = "";

  const all = [
    ...p.income.map((i, index) => ({ ...i, type: "income", index })),
    ...p.expenses.map((e, index) => ({ ...e, type: "expense", index }))
  ].sort((a, b) => b.timestamp - a.timestamp);

  if (all.length === 0) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">📊</div>
      <h3 class="text-h3 mb-2">No transactions yet</h3>
      <p class="text-body text-secondary">Add your first transaction to get started</p>
    </div>`;
    return;
  }

  all.forEach((t) => {
    const row = document.createElement("div");
    row.className = "expense-item";
    
    const isIncome = t.type === "income";
    const icon = isIncome ? "💰" : "🛒";
    const name = isIncome ? t.source : t.name;
    const sign = isIncome ? "+" : "-";
    const amountClass = isIncome ? "text-success" : "text-danger";

    row.innerHTML = `
      <div class="expense-details">
        <div class="text-body font-medium">${icon} ${escapeHtml(name)}</div>
        <div class="text-caption text-tertiary">${new Date(t.timestamp).toLocaleString()}</div>
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