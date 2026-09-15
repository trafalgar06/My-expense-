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
  const pageMap = {
    'dashboard': 'dashboard',
    'index': 'dashboard',
    'expenses': 'expenses',
    'report': 'reports',
    'reports': 'reports',
    'setting': 'settings',
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

  let value = Number(n || 0);

  // Snap anything under half the smallest displayed unit (a paisa/cent)
  // to a clean positive zero before formatting. `n || 0` only catches an
  // exact -0 — but Intl's currency formatter does NOT collapse a real
  // near-zero negative (e.g. -0.0000000002, the kind of residue ordinary
  // binary floating-point math leaves behind after enough additions and
  // subtractions) the way roundCurrency's Math.round does. It renders it
  // as "-₹0.00": a balance that reads as "less than zero rupees" while
  // every visible digit is 0, which reasonably looks broken to whoever's
  // looking at their own account balance.
  if (Math.abs(value) < 0.005) {
    value = 0;
  }

  return value.toLocaleString(locale, {
    style: "currency",
    currency: currency
  });
}

// Rounds a number to 2 decimal places, correcting for classic binary
// floating-point drift (e.g. 0.1 + 0.2 = 0.30000000000000004). Every
// place that mutates a running account balance should pass its result
// through this before storing it, otherwise tiny fractions-of-a-paisa
// errors accumulate over many transactions until the raw stored balance
// no longer matches the rounded amount shown on screen — which then
// makes exact "transfer everything" style actions fail with a false
// "insufficient balance" error, because the raw value is a hair less
// than the number the user typed back in from what they saw displayed.
export function roundCurrency(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

// ========== Category Limit Warnings ==========
// Surfaces a category's monthly spending limit at the moment someone is
// about to add/edit an expense, instead of only showing it retrospectively
// on the Dashboard's progress bars (where it's easy to miss until you
// happen to check). Returns null when there's nothing worth flagging.
export function getCategoryLimitWarning(periodExpenses, category, amount, excludeIndex = null) {
  if (!category || !amount || isNaN(amount) || amount <= 0) return null;

  const limits = safeJSONParse("categoryLimits", {});
  const limit = Number(limits[category]);
  if (!limit || limit <= 0) return null;

  const alreadySpent = (periodExpenses || []).reduce((sum, e, idx) => {
    if (idx === excludeIndex) return sum; // don't double-count the expense being edited
    return e.category === category ? sum + e.amount : sum;
  }, 0);

  const projected = roundCurrency(alreadySpent + Number(amount));
  const percent = Math.round((projected / limit) * 100);

  if (projected > limit) {
    return {
      level: "exceeded",
      message: `⚠️ This puts ${category} at ${fmt(projected)}, ${fmt(roundCurrency(projected - limit))} over your ${fmt(limit)} monthly limit.`
    };
  }
  if (percent >= 80) {
    return {
      level: "caution",
      message: `This puts ${category} at ${percent}% of its ${fmt(limit)} monthly limit.`
    };
  }
  return null;
}

// Renders the warning (or clears it) into the given banner element.
export function renderCategoryLimitWarning(bannerEl, periodExpenses, category, amount, excludeIndex = null) {
  if (!bannerEl) return;
  const warning = getCategoryLimitWarning(periodExpenses, category, amount, excludeIndex);
  bannerEl.className = "limit-warning-banner";
  if (warning) {
    bannerEl.classList.add(warning.level === "exceeded" ? "warning-exceeded" : "warning-caution");
    bannerEl.textContent = warning.message;
  } else {
    bannerEl.textContent = "";
  }
}

// ========== Category Icon Colors ==========
// Deterministic pastel background per category (hash of the name), so the
// transaction list gets the "colored icon badge per category" look
// without needing a manually-curated color map for arbitrary user-created
// categories.
const CATEGORY_BADGE_COLORS = [
  "#FEE2E2", "#FEF3C7", "#D1FAE5", "#DBEAFE",
  "#EDE9FE", "#FCE7F3", "#E0F2FE", "#FFEDD5"
];

export function getCategoryBadgeColor(category) {
  const str = String(category || "Other");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return CATEGORY_BADGE_COLORS[hash % CATEGORY_BADGE_COLORS.length];
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
    period = getCurrentPeriod();
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

// ========== Viewed Period (shared across every page) ==========
// ONE key for the whole app, not one per page.
//
// Previously each page stored its own `period_{page}` key. That meant
// Dashboard, Transactions and Reports could each be looking at a
// different month without the user ever being told — so adding an
// expense on the Dashboard (September) and then opening Transactions
// (still remembering August from an earlier visit) showed an empty list
// and a zeroed Report, making it look like the transaction was never
// saved at all. The data was always written correctly; the other pages
// were simply pointed at a different month.
//
// A single shared key means "the month I'm looking at" follows the user
// from page to page, which is what a finance app is expected to do.
const PERIOD_KEY = "exp_tracker_period";
const LEGACY_PERIOD_KEYS = ["period_dashboard", "period_expenses", "period_reports", "period_settings"];

export function getCurrentPeriod() {
  let period = localStorage.getItem(PERIOD_KEY);

  // One-time migration: adopt whichever month the user was last on
  // (Dashboard wins, since it's the landing page) instead of silently
  // resetting them to today's month on upgrade.
  if (!period) {
    for (const legacyKey of LEGACY_PERIOD_KEYS) {
      const legacyValue = localStorage.getItem(legacyKey);
      if (legacyValue && /^\d{4}-\d{2}$/.test(legacyValue)) {
        period = legacyValue;
        break;
      }
    }
  }

  if (!period || !/^\d{4}-\d{2}$/.test(period)) {
    period = toPeriod(new Date().getFullYear(), new Date().getMonth() + 1);
  }

  localStorage.setItem(PERIOD_KEY, period);
  return period;
}

export function setCurrentPeriod(period) {
  localStorage.setItem(PERIOD_KEY, period);
  // Keep the legacy keys in step so any stale page/tab still running the
  // old code can't drag the app back to a different month.
  LEGACY_PERIOD_KEYS.forEach(k => localStorage.setItem(k, period));
  return period;
}

// Consistent period initialization across modules
export function initPeriod() {
  return getCurrentPeriod();
}

// Consistent period navigation across modules
export function navigatePeriod(currentPeriod, delta) {
  const { year, month } = parsePeriod(currentPeriod);
  const d = new Date(year, month - 1 + delta, 1);
  return setCurrentPeriod(toPeriod(d.getFullYear(), d.getMonth() + 1));
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
// (the same shared key initPeriod()/navigatePeriod() use) rather than a
// cross-module variable, since bootstrap.js imports every page's module
// on every page — a window-bound getter would get overwritten by
// whichever module was imported last, regardless of which page is active.
export function getDefaultDateForPeriod() {
  const today = new Date();
  const todayStr = today.toLocaleDateString("en-CA");
  const todayPeriod = todayStr.substring(0, 7);

  const viewedPeriod = getCurrentPeriod();

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
window.roundCurrency = roundCurrency;
window.escapeHtml = escapeHtml;
window.getCategoryLimitWarning = getCategoryLimitWarning;
window.renderCategoryLimitWarning = renderCategoryLimitWarning;
window.getCategoryBadgeColor = getCategoryBadgeColor;
window.getGreeting = getGreeting;
window.updateGreeting = updateGreeting;
window.renderMonthlySummaryUtils = renderMonthlySummaryUtils;
window.initPeriod = initPeriod;
window.navigatePeriod = navigatePeriod;
window.getCurrentPeriod = getCurrentPeriod;
window.setCurrentPeriod = setCurrentPeriod;
window.populateExpenseCategoryDropdown = populateExpenseCategoryDropdown;
window.populateIncomeCategoryDropdown = populateIncomeCategoryDropdown;
window.getUnifiedCategories = getUnifiedCategories;
window.getCategoryEmoji = getCategoryEmoji;window.safeJSONParse = safeJSONParse;
window.getDefaultDateForPeriod = getDefaultDateForPeriod;
