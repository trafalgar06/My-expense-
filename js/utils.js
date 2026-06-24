// ========== Utility Functions ==========
export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Safe fallback for crypto.randomUUID() for browser compatibility
export function generateUUID() {
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
export const CATEGORY_LIST = ["Food", "Transport", "Shopping", "Entertainment", "Healthcare", "Education", "Bills", "Other"];

// Category emojis mapping
export const CATEGORY_EMOJIS = {
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
export const INCOME_CATEGORY_EMOJIS = {
  "Salary": "💼",
  "Freelance": "💻",
  "Investment": "📈",
  "Gift": "🎁",
  "Other": "📦"
};

export function toPeriod(y, m) {
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function parsePeriod(p) {
  const [y, mm] = p.split("-").map(Number);
  return { year: y, month: mm };
}

// Get current page name for period key creation
export function getCurrentPage() {
  const path = window.location.pathname;
  const page = path.split('/').pop().replace('.html', '') || 'dashboard';
  // Map to known page names
  const pageMap = {
    'dashboard': 'dashboard',
    'expenses': 'expenses',
    'reports': 'reports',
    'income': 'income',
    'settings': 'settings'
  };
  return pageMap[page] || 'dashboard';
}

export function periodDisplay(p) {
  const { year, month } = parsePeriod(p);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function fmt(n) {
  // Get currency from settings, default to INR
  const currency = (window.store && window.store.settings && window.store.settings.currency) || "INR";
  const locale = currency === "INR" ? "en-IN" : "en-US";

  return Number(n || 0).toLocaleString(locale, {
    style: "currency",
    currency: currency
  });
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[m]);
}

// ========== Greeting Function ==========
export function getGreeting() {
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

export function updateGreeting() {
  const greetingElement = document.querySelector('.greeting');
  if (greetingElement) {
    greetingElement.textContent = `${getGreeting()}, User`;
  }
}

// ========== Monthly Summary ==========
// Renamed to avoid collision with reports.js version
export function renderMonthlySummaryUtils(period) {
  // Make sure period is initialized
  if (!period) {
    const page = getCurrentPage();
    const key = `period_${page}`;
    period = localStorage.getItem(key) || toPeriod(new Date().getFullYear(), new Date().getMonth() + 1);
  }

  // getPeriodData comes from storage.js, but since it's global or imported, we can reference it
  const p = window.getPeriodData ? window.getPeriodData(period) : { income: [], expenses: [], budget: 0, added: 0 };

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
export function initPeriod() {
  const page = getCurrentPage();
  const key = `period_${page}`;
  let currentPeriod = localStorage.getItem(key);
  if (!currentPeriod) {
    currentPeriod = toPeriod(new Date().getFullYear(), new Date().getMonth() + 1);
    localStorage.setItem(key, currentPeriod);
  }
  return currentPeriod;
}

// Consistent period navigation across modules
export function navigatePeriod(currentPeriod, delta) {
  const { year, month } = parsePeriod(currentPeriod);
  const d = new Date(year, month - 1 + delta, 1);
  const newPeriod = toPeriod(d.getFullYear(), d.getMonth() + 1);
  // Use page-specific key
  const page = getCurrentPage();
  const key = `period_${page}`;
  localStorage.setItem(key, newPeriod);
  return newPeriod;
}

export function getUnifiedCategories() {
  const custom = (window.store && window.store.settings && window.store.settings.customCategories) || [];
  return [...CATEGORY_LIST, ...custom.map(c => c.name)];
}

export function getCategoryEmoji(cat) {
  if (CATEGORY_EMOJIS[cat]) return CATEGORY_EMOJIS[cat];
  const custom = (window.store && window.store.settings && window.store.settings.customCategories) || [];
  const match = custom.find(c => c.name === cat);
  return match ? match.emoji : "📦";
}

// Populate expense category dropdown
export function populateExpenseCategoryDropdown(selectElement) {
  if (!selectElement) return;

  const isFirstOptionAll = selectElement.options[0] && selectElement.options[0].value === "all";
  selectElement.innerHTML = isFirstOptionAll ? '<option value="all">All Categories</option>' : '';

  const categories = getUnifiedCategories();

  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = `${getCategoryEmoji(category)} ${category}`;
    selectElement.appendChild(option);
  });
}

// Populate income category dropdown
export function populateIncomeCategoryDropdown(selectElement) {
  if (!selectElement) return;

  const isFirstOptionAll = selectElement.options[0] && selectElement.options[0].value === "all";
  selectElement.innerHTML = isFirstOptionAll ? '<option value="all">All Categories</option>' : '';

  const incomeCategories = ["Salary", "Freelance", "Investment", "Gift", "Other"];
  incomeCategories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = `${INCOME_CATEGORY_EMOJIS[category] || '📦'} ${category}`;
    selectElement.appendChild(option);
  });
}

export function normalizeDate(dateValue) {
  if (!dateValue) return "";
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split('T')[0]; // always returns "YYYY-MM-DD"
}

// Bind to window for global access/compatibility
window.normalizeDate = normalizeDate;
// Safely reads and parses a JSON value from LocalStorage. Never throws —
// if the key is missing or the stored value isn't valid JSON (e.g. from
// a corrupted write or manual edit), this returns the given fallback
// instead of crashing whatever function called it. Several places in
// this app used a bare JSON.parse(localStorage.getItem(key) || "[]")
// with no error handling, which would silently halt an entire render
// function (including the transaction list) if that one value was ever
// malformed.
export function safeJSONParse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Corrupted data in localStorage["${key}"], using fallback.`, e);
    return fallback;
  }
}

// Returns a default value for date <input> fields that respects whichever
// period (month) the user is currently viewing, instead of always
// defaulting to today's real-world date. If today's real date falls
// inside the viewed period, use today (the natural default). Otherwise,
// use the 1st of the viewed period — this prevents transactions added
// while browsing a past or future month from silently being filed under
// the wrong month's records.
//
// Reads the viewed period directly from its LocalStorage source of truth
// (the same `period_{page}` key initPeriod()/navigatePeriod() use) rather
// than a cross-module variable, since bootstrap.js imports every page's
// module on every page — a window-bound getter would get overwritten by
// whichever module was imported last, regardless of which page is active.
export function getDefaultDateForPeriod() {
  const today = new Date();
  const todayStr = today.toLocaleDateString("en-CA");
  const todayPeriod = todayStr.substring(0, 7);

  const page = getCurrentPage();
  const viewedPeriod = localStorage.getItem(`period_${page}`);

  if (!viewedPeriod || viewedPeriod === todayPeriod) {
    return todayStr;
  }

  // 1st of the viewed period, e.g. "2026-01-01"
  return `${viewedPeriod}-01`;
}

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
window.getUnifiedCategories = getUnifiedCategories;
window.getCategoryEmoji = getCategoryEmoji;window.safeJSONParse = safeJSONParse;
window.getDefaultDateForPeriod = getDefaultDateForPeriod;
