// ========== Expenses ==========
import { loadStore, ensurePeriod, getPeriodData, saveStore, adjustAccountBalance } from './storage.js';
import { initPeriod, navigatePeriod, periodDisplay, fmt, escapeHtml, populateExpenseCategoryDropdown, populateIncomeCategoryDropdown, getCategoryEmoji, getUnifiedCategories, generateUUID, MONTH_NAMES, toPeriod, getCurrentPage, normalizeDate, safeJSONParse, getDefaultDateForPeriod } from './utils.js';
import { openMoneyModal, closeMoneyModal, openExpenseModal, closeExpenseModal, closeEditExpenseModal, closeEditIncomeModal } from './modal.js';

let currentPeriod = "";
let expensesFilters = {
  search: "",
  category: "all",
  type: "all",
  minAmount: "",
  maxAmount: ""
};
let selectedDateFilter = null;
let calendarViewYear = null;
let calendarViewMonth = null;

// Positions the calendar popup using only top/left in whole pixels (no
// transform, no CSS class toggling) so the browser never has to combine
// a CSS transform with inline offsets across two separate paint passes.
// That combination was the likely cause of the popup visibly "jumping"
// or vibrating right after opening or after a date selection re-render.
function positionCalendarPopup(popup, anchorBtn) {
  const margin = 12;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const wasVisible = popup.style.display === "block";

  // Measure the popup's real width without it being visible to the user,
  // so min(320px, calc(100vw - 32px)) resolves to a real number even on
  // the very first open (when offsetWidth would otherwise be 0).
  const originalVisibility = popup.style.visibility;
  if (!wasVisible) {
    popup.style.visibility = "hidden";
    popup.style.display = "block";
  }
  const popupWidth = popup.offsetWidth || 320;
  const popupHeight = popup.offsetHeight || 320;
  if (!wasVisible) {
    popup.style.display = "none";
    popup.style.visibility = originalVisibility;
  }

  const rect = anchorBtn.getBoundingClientRect();

  let left;
  if (viewportWidth < 768) {
    // Mobile: center horizontally in the viewport, ignoring the button's
    // position, since the header can reflow and move the button around.
    left = (viewportWidth - popupWidth) / 2;
  } else {
    // Desktop/tablet: align to the button's right edge, clamped to stay
    // fully on-screen on both sides.
    left = rect.right - popupWidth;
  }
  left = Math.max(margin, Math.min(left, viewportWidth - popupWidth - margin));

  let top = rect.bottom + 8;
  if (top + popupHeight > viewportHeight - margin) {
    // Not enough room below the button — place it above instead.
    top = Math.max(margin, rect.top - popupHeight - 8);
  }

  popup.style.position = "fixed";
  popup.style.transform = "none";
  popup.style.left = `${Math.round(left)}px`;
  popup.style.top = `${Math.round(top)}px`;
  popup.style.right = "auto";
}

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
      if (window.updateGreeting) window.updateGreeting();
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
      const page = getCurrentPage();
      const key = `period_${page}`;
      localStorage.setItem(key, currentPeriod);
      ensurePeriod(currentPeriod);
      selectedDateFilter = null;
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

  const toggleAdvancedBtn = document.getElementById("toggle-advanced-btn");
  const advancedFiltersSection = document.getElementById("advanced-filters-section");
  if (toggleAdvancedBtn && advancedFiltersSection) {
    toggleAdvancedBtn.addEventListener("click", () => {
      const isCollapsed = advancedFiltersSection.style.maxHeight === "0px" || advancedFiltersSection.style.maxHeight === "" || advancedFiltersSection.style.maxHeight === "0";
      if (isCollapsed) {
        advancedFiltersSection.style.maxHeight = "500px";
        advancedFiltersSection.style.opacity = "1";
        advancedFiltersSection.style.paddingTop = "var(--space-4)";
        advancedFiltersSection.style.marginTop = "var(--space-4)";
        toggleAdvancedBtn.textContent = "Advanced Filters ▴";
      } else {
        advancedFiltersSection.style.maxHeight = "0";
        advancedFiltersSection.style.opacity = "0";
        advancedFiltersSection.style.paddingTop = "0";
        advancedFiltersSection.style.marginTop = "0";
        toggleAdvancedBtn.textContent = "Advanced Filters ▾";
      }
    });
  }

  const calendarBtn = document.getElementById("calendar-btn");
  if (calendarBtn) {
    calendarBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const popup = document.getElementById("calendar-popup");
      if (!popup) return;
      if (popup.style.display === "block") {
        popup.style.display = "none";
      } else {
        const [year, month] = currentPeriod.split("-").map(Number);
        calendarViewYear = year;
        calendarViewMonth = month;
        renderInlineCalendar();

        positionCalendarPopup(popup, calendarBtn);
        popup.style.display = "block";
      }
    });
  }

  const calPrevBtn = document.getElementById("cal-prev-month");
  if (calPrevBtn) {
    calPrevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (calendarViewYear === null || calendarViewMonth === null) {
        const [year, month] = currentPeriod.split("-").map(Number);
        calendarViewYear = year;
        calendarViewMonth = month;
      }
      calendarViewMonth--;
      if (calendarViewMonth === 0) {
        calendarViewMonth = 12;
        calendarViewYear--;
      }
      renderInlineCalendar();
    });
  }

  const calNextBtn = document.getElementById("cal-next-month");
  if (calNextBtn) {
    calNextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (calendarViewYear === null || calendarViewMonth === null) {
        const [year, month] = currentPeriod.split("-").map(Number);
        calendarViewYear = year;
        calendarViewMonth = month;
      }
      calendarViewMonth++;
      if (calendarViewMonth === 13) {
        calendarViewMonth = 1;
        calendarViewYear++;
      }
      renderInlineCalendar();
    });
  }

  document.addEventListener("click", (e) => {
    const popup = document.getElementById("calendar-popup");
    const calendarBtn = document.getElementById("calendar-btn");
    if (popup && popup.style.display === "block") {
      if (!popup.contains(e.target) && e.target !== calendarBtn) {
        popup.style.display = "none";
      }
    }
  });

  const clearDateFilterBtn = document.getElementById("clear-date-filter-btn");
  if (clearDateFilterBtn) {
    clearDateFilterBtn.addEventListener("click", () => {
      selectedDateFilter = null;
      renderExpenses();
    });
  }

  const searchInput = document.getElementById("filter-search");
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
      selectedDateFilter = null;
      if (searchInput) searchInput.value = "";
      if (categorySelect) categorySelect.value = "all";
      if (typeSelect) typeSelect.value = "all";
      if (minAmountInput) minAmountInput.value = "";
      if (maxAmountInput) maxAmountInput.value = "";
      renderExpenses();
    });
  }
}

function openAddExpenseModal() {
  const safeDate = getDefaultDateForPeriod();

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

        <div class="input-group mb-4">
          <label for="expense-account" class="input-label">Account</label>
          <select id="expense-account" class="input-field">
            <option value="bank">🏦 Bank / Online</option>
            <option value="cash">💵 Cash</option>
            <option value="savings">🐖 Savings</option>
          </select>
        </div>
        
        <div class="input-group mb-4" style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
          <input type="checkbox" id="expense-recurring" style="width: auto; margin: 0;">
          <label for="expense-recurring" class="input-label" style="margin: 0; cursor: pointer;">Recurring</label>
        </div>
        <div id="expense-frequency-group" class="input-group mb-4" style="display: none; margin-bottom: 16px;">
          <label for="expense-frequency" class="input-label">Frequency</label>
          <select id="expense-frequency" class="input-field">
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
          </select>
        </div>

        <button id="submit-add-expense" class="btn btn-primary w-full">
          Add Expense
        </button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const expenseCategorySelect = document.getElementById('expense-category');
  if (expenseCategorySelect) {
    populateExpenseCategoryDropdown(expenseCategorySelect);
  }

  const recCheck = document.getElementById("expense-recurring");
  const freqGroup = document.getElementById("expense-frequency-group");
  if (recCheck && freqGroup) {
    recCheck.addEventListener("change", function() {
      freqGroup.style.display = this.checked ? "block" : "none";
    });
  }

  document.getElementById("close-add-expense").addEventListener("click", closeAddExpenseModal);
  document.getElementById("submit-add-expense").addEventListener("click", addExpense);

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
  const accountInput = document.getElementById("expense-account");
  const account = accountInput ? accountInput.value : "bank";

  if (!name) {
    alert("Please enter the expense name");
    return;
  }

  if (isNaN(amt) || amt <= 0) {
    alert("Please enter a valid amount");
    return;
  }

  const defaultDate = getDefaultDateForPeriod();
  const selectedDate = dateInput && dateInput.value ? dateInput.value : defaultDate;

  const recurringCheckbox = document.getElementById("expense-recurring");
  const isRecurring = recurringCheckbox ? recurringCheckbox.checked : false;
  const frequencySelect = document.getElementById("expense-frequency");
  const frequency = isRecurring && frequencySelect ? frequencySelect.value : "";

  let templateId = "";
  if (isRecurring) {
    templateId = generateUUID();
    const templates = safeJSONParse("recurringTransactions", []);
    templates.push({
      id: templateId,
      type: "expense",
      name: name,
      category: category || "Other",
      amount: amt,
      frequency: frequency,
      startDate: selectedDate,
      account: account
    });
    localStorage.setItem("recurringTransactions", JSON.stringify(templates));
  }

  // The transaction always belongs to the period currently being viewed —
  // not whatever period the date string happens to fall into. This keeps
  // what's on screen and what actually gets written in sync.
  const targetDate = normalizeDate(selectedDate) || defaultDate;

  const newExpense = {
    id: generateUUID(),
    name,
    amount: amt,
    category: category || "Other",
    date: targetDate,
    timestamp: Date.now(),
    recurringTemplateId: templateId,
    account: account
  };

  getPeriodData(currentPeriod).expenses.push(newExpense);
  adjustAccountBalance(account, -amt);

  closeAddExpenseModal();
  saveStore();
  renderExpenses();

  if (window.auditLog) {
    window.auditLog.logAddExpense(newExpense);
  }
}

function openAddIncomeModal() {
  const safeDate = getDefaultDateForPeriod();

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

        <div class="input-group mb-4">
          <label for="income-account" class="input-label">Account</label>
          <select id="income-account" class="input-field">
            <option value="bank">🏦 Bank / Online</option>
            <option value="cash">💵 Cash</option>
          </select>
        </div>
        
        <div class="input-group mb-4" style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
          <input type="checkbox" id="income-recurring" style="width: auto; margin: 0;">
          <label for="income-recurring" class="input-label" style="margin: 0; cursor: pointer;">Recurring</label>
        </div>
        <div id="income-frequency-group" class="input-group mb-4" style="display: none; margin-bottom: 16px;">
          <label for="income-frequency" class="input-label">Frequency</label>
          <select id="income-frequency" class="input-field">
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
          </select>
        </div>
        
        <button id="submit-add-income" class="btn btn-primary w-full">
          Add Income
        </button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const incomeCategorySelect = document.getElementById('income-category');
  if (incomeCategorySelect) {
    populateIncomeCategoryDropdown(incomeCategorySelect);
  }

  const recCheck = document.getElementById("income-recurring");
  const freqGroup = document.getElementById("income-frequency-group");
  if (recCheck && freqGroup) {
    recCheck.addEventListener("change", function() {
      freqGroup.style.display = this.checked ? "block" : "none";
    });
  }

  document.getElementById("close-add-income").addEventListener("click", closeAddIncomeModal);
  document.getElementById("submit-add-income").addEventListener("click", addIncome);

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
  const accountInput = document.getElementById("income-account");
  const account = accountInput ? accountInput.value : "bank";

  if (!source) {
    alert("Please enter the income source");
    return;
  }

  if (isNaN(amt) || amt <= 0) {
    alert("Please enter a valid amount");
    return;
  }

  const defaultDate = getDefaultDateForPeriod();
  const selectedDate = dateInput && dateInput.value ? dateInput.value : defaultDate;

  const p = getPeriodData(currentPeriod);

  const recurringCheckbox = document.getElementById("income-recurring");
  const isRecurring = recurringCheckbox ? recurringCheckbox.checked : false;
  const frequencySelect = document.getElementById("income-frequency");
  const frequency = isRecurring && frequencySelect ? frequencySelect.value : "";

  let templateId = "";
  if (isRecurring) {
    templateId = generateUUID();
    const templates = safeJSONParse("recurringTransactions", []);
    templates.push({
      id: templateId,
      type: "income",
      name: source,
      category: "Income",
      amount: amt,
      frequency: frequency,
      startDate: selectedDate,
      account: account
    });
    localStorage.setItem("recurringTransactions", JSON.stringify(templates));
  }

  // The transaction always belongs to the period currently being viewed —
  // not whatever period the date string happens to fall into.
  const targetDate = normalizeDate(selectedDate) || defaultDate;

  const newIncome = {
    id: generateUUID(),
    source,
    amount: amt,
    category: category || "Other",
    date: targetDate,
    timestamp: Date.now(),
    recurringTemplateId: templateId,
    account: account
  };

  p.income.push(newIncome);
  p.added += amt;
  adjustAccountBalance(account, amt);

  closeAddIncomeModal();
  saveStore();
  renderExpenses();

  if (window.auditLog) {
    window.auditLog.logAddIncome(newIncome);
  }
}

function renderExpenses() {
  const p = getPeriodData(currentPeriod);
  document.getElementById("current-period").textContent = periodDisplay(currentPeriod);

  const spent = p.expenses.reduce((sum, e) => sum + e.amount, 0);
  const spentDisplay = document.getElementById("spent-display");
  if (spentDisplay) spentDisplay.textContent = fmt(spent);

  // Active filter banner
  const banner = document.getElementById("active-date-filter-banner");
  const bannerText = document.getElementById("active-date-filter-text");
  if (banner && bannerText) {
    if (selectedDateFilter) {
      const normalized = normalizeDate(selectedDateFilter);
      const [y, m, d] = normalized.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      const day = dateObj.getDate();
      const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = monthNamesShort[dateObj.getMonth()];
      const year = dateObj.getFullYear();
      bannerText.textContent = `${day} ${month} ${year}`;
      banner.style.display = "flex";
    } else {
      banner.style.display = "none";
    }
  }

  const list = document.getElementById("expense-list");
  list.innerHTML = "";

  let all = [
    ...p.income.map((i, index) => ({ ...i, type: "income", index })),
    ...p.expenses.map((e, index) => ({ ...e, type: "expense", index }))
  ];

  // Apply search filter
  if (expensesFilters.search) {
    all = all.filter(t => {
      const name = t.type === "income" ? t.source : t.name;
      return name.toLowerCase().includes(expensesFilters.search);
    });
  }

  // Apply category filter
  if (expensesFilters.category && expensesFilters.category !== "all") {
    all = all.filter(t => t.category === expensesFilters.category);
  }

  // Apply type filter
  if (expensesFilters.type && expensesFilters.type !== "all") {
    all = all.filter(t => t.type === expensesFilters.type);
  }

  // Apply amount filters
  if (expensesFilters.minAmount !== "") {
    all = all.filter(t => t.amount >= Number(expensesFilters.minAmount));
  }
  if (expensesFilters.maxAmount !== "") {
    all = all.filter(t => t.amount <= Number(expensesFilters.maxAmount));
  }

  // Note: no extra month/year re-filter here. `p` already comes from
  // getPeriodData(currentPeriod), so every item in p.income/p.expenses
  // is already scoped to the period being viewed by definition of where
  // it's stored. Re-deriving year/month from each item's `date` field and
  // filtering on it again was redundant when dates are consistent, and
  // actively hid otherwise-correct transactions whenever a transaction's
  // `date` field didn't exactly agree with the period it was filed under
  // (e.g. picking a date in one month while viewing another).

  if (selectedDateFilter) {
    all = all.filter(t => normalizeDate(t.date) === normalizeDate(selectedDateFilter));
  }

  all.sort((a, b) => b.timestamp - a.timestamp);

  if (all.length === 0) {
    if (selectedDateFilter) {
      const normalized = normalizeDate(selectedDateFilter);
      const [y, m, d] = normalized.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      const day = dateObj.getDate();
      const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const shortMonth = monthNamesShort[dateObj.getMonth()];
      const formattedDate = `${day} ${shortMonth} ${dateObj.getFullYear()}`;
      list.innerHTML = `<div class="empty-state">
        <h3 class="text-h3 mb-2">No transactions on this date</h3>
        <p class="text-body text-secondary">No transactions found for ${formattedDate}</p>
      </div>`;
    } else {
      list.innerHTML = `<div class="empty-state">
        <div class="empty-state-icon">💸</div>
        <h3 class="text-h3 mb-2">No transactions found</h3>
        <p class="text-body text-secondary">Try adjusting your filters or add a new transaction</p>
      </div>`;
    }
    return;
  }

  all.forEach((t) => {
    const row = document.createElement("div");
    row.className = "expense-item";

    const isIncome = t.type === "income";
    const category = t.category || "Other";
    const icon = getCategoryEmoji(category);
    const name = isIncome ? t.source : t.name;
    const sign = isIncome ? "+" : "-";
    const amountClass = isIncome ? "text-success" : "text-danger";

    const isRecurring = !!t.recurringTemplateId;
    const accountIcon = t.account === "cash" ? "💵" : t.account === "savings" ? "🐖" : "🏦";
    const accountLabel = t.account === "cash" ? "Cash" : t.account === "savings" ? "Savings" : "Bank / Online";
    row.innerHTML = `
      <div class="expense-details">
        <div class="text-body font-medium">${escapeHtml(icon)} ${escapeHtml(name)}${isRecurring ? ' 🔁' : ''} <span title="${accountLabel}" style="font-size: 0.85em;">${accountIcon}</span></div>
        <div class="text-caption text-tertiary">
          ${escapeHtml(category)} • ${new Date(t.date).toLocaleDateString()}
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

  document.querySelectorAll(".delete-btn").forEach(button => {
    button.addEventListener("click", function () {
      const type = this.getAttribute("data-type");
      const index = parseInt(this.getAttribute("data-index"));

      if (type === "income") {
        const deletedIncome = p.income[index];
        p.added -= deletedIncome.amount;
        p.income.splice(index, 1);
        adjustAccountBalance(deletedIncome.account || "bank", -deletedIncome.amount);

        if (window.auditLog) {
          window.auditLog.logDeleteIncome(deletedIncome);
        }
      } else {
        const deletedExpense = p.expenses[index];
        p.expenses.splice(index, 1);
        adjustAccountBalance(deletedExpense.account || "bank", deletedExpense.amount);

        if (window.auditLog) {
          window.auditLog.logDeleteExpense(deletedExpense);
        }
      }

      saveStore();
      renderExpenses();
    });
  });
}

function renderInlineCalendar() {
  const popup = document.getElementById("calendar-popup");
  if (!popup) return;

  if (calendarViewYear === null || calendarViewMonth === null) {
    const [year, month] = currentPeriod.split("-").map(Number);
    calendarViewYear = year;
    calendarViewMonth = month;
  }

  const year = calendarViewYear;
  const month = calendarViewMonth;
  const numDays = new Date(year, month, 0).getDate();
  const startDay = new Date(year, month - 1, 1).getDay();

  const titleEl = document.getElementById("calendar-title");
  if (titleEl) {
    titleEl.textContent = `${MONTH_NAMES[month - 1]} ${year}`;
  }

  const bodyEl = document.getElementById("calendar-popup-body");
  if (!bodyEl) return;
  let calendarHTML = `
    <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center; font-weight: 600; margin-bottom: 8px; color: var(--text-secondary); font-size: 11px;">
      <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
    </div>
    <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; font-size: 12px;">
  `;

  for (let i = 0; i < startDay; i++) {
    calendarHTML += `<div></div>`;
  }

  const targetPeriod = `${year}-${String(month).padStart(2, '0')}`;
  const hasTxDays = new Set();
  if (window.store && window.store.periods && window.store.periods[targetPeriod]) {
    const p = window.store.periods[targetPeriod];
    [...p.expenses, ...p.income].forEach(t => {
      if (t.date) {
        const normalized = normalizeDate(t.date);
        const parts = normalized.split("-");
        if (parts[0] === String(year) && Number(parts[1]) === month) {
          const dStr = parts[2];
          if (dStr) hasTxDays.add(parseInt(dStr, 10));
        }
      }
    });
  }

  for (let day = 1; day <= numDays; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isSelected = selectedDateFilter === dateStr;
    const hasTx = hasTxDays.has(day);

    const cellStyle = `
      cursor: pointer;
      padding: 6px 4px;
      text-align: center;
      border-radius: 50%;
      font-weight: 500;
      position: relative;
      background: ${isSelected ? 'var(--accent-primary)' : 'transparent'};
      color: ${isSelected ? '#ffffff' : 'var(--text-primary)'};
    `;

    calendarHTML += `
      <div class="calendar-day-cell" data-date="${dateStr}" style="${cellStyle}" title="${hasTx ? 'Has transactions' : ''}">
        <span>${day}</span>
        ${hasTx && !isSelected ? `<span style="width: 4px; height: 4px; background: var(--accent-primary); border-radius: 50%; position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%);"></span>` : ''}
      </div>
    `;
  }

  calendarHTML += `</div>`;
  bodyEl.innerHTML = calendarHTML;

  bodyEl.querySelectorAll(".calendar-day-cell").forEach(cell => {
    cell.addEventListener("click", function(e) {
      e.stopPropagation();
      selectedDateFilter = this.getAttribute("data-date");
      
      // Update currentPeriod to match selected date's period
      const newPeriod = selectedDateFilter.substring(0, 7);
      currentPeriod = newPeriod;
      const page = getCurrentPage();
      const key = `period_${page}`;
      localStorage.setItem(key, currentPeriod);
      ensurePeriod(currentPeriod);

      popup.style.display = "none";
      renderExpenses();
    });
  });

  // Re-anchor position if the popup is already open and visible — month
  // navigation can change the number of grid rows, which changes height.
  if (popup.style.display === "block") {
    const calendarBtn = document.getElementById("calendar-btn");
    if (calendarBtn) {
      positionCalendarPopup(popup, calendarBtn);
    }
  }
}

function shift(delta) {
  currentPeriod = navigatePeriod(currentPeriod, delta);
  ensurePeriod(currentPeriod);
  selectedDateFilter = null;
  renderExpenses();
}

export function initializeExpensesPage() {
  if (document.getElementById('expense-list')) {
    loadStore();
    currentPeriod = initPeriod();
    ensurePeriod(currentPeriod);

    const filterCategorySelect = document.getElementById('filter-category');
    if (filterCategorySelect) {
      populateExpenseCategoryDropdown(filterCategorySelect);
    }

    bindEvents();
    renderExpenses();
    updateGreeting();
    setInterval(updateGreeting, 60000);
  }
}

// Bind to window for global access/compatibility
window.initializeExpensesPage = initializeExpensesPage;