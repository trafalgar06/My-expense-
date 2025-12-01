// ========== Utility Functions ==========
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

function toPeriod(y, m) {
  return `${y}-${String(m).padStart(2, "0")}`;
}

function parsePeriod(p) {
  const [y, mm] = p.split("-").map(Number);
  return { year: y, month: mm };
}

// Get current page name for period key creation
function getCurrentPage() {
  const path = window.location.pathname;
  const page = path.split('/').pop().replace('.html', '') || 'dashboard';
  // Map to known page names
  const pageMap = {
    'dashboard': 'dashboard',
    'expenses': 'expenses',
    'reports': 'reports',
    'income': 'income',
    'categories': 'categories',
    'goals': 'goals',
    'settings': 'settings',
    'period-selection': 'period_selection'
  };
  return pageMap[page] || 'dashboard';
}

function periodDisplay(p) {
  const { year, month } = parsePeriod(p);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

function fmt(n) {
  // Get currency from settings, default to INR
  const currency = (window.store && window.store.settings && window.store.settings.currency) || "INR";
  const locale = currency === "INR" ? "en-IN" : "en-US";
  
  return Number(n || 0).toLocaleString(locale, {
    style: "currency",
    currency: currency
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]'/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[m]);
}

// Consistent period initialization across modules
function initPeriod() {
  // Get current page name to create page-specific key
  const page = getCurrentPage();
  const key = `period_${page}`;
  
  const savedPeriod = localStorage.getItem(key);
  if (savedPeriod) {
    return savedPeriod;
  } else {
    const currentPeriod = toPeriod(new Date().getFullYear(), new Date().getMonth() + 1);
    localStorage.setItem(key, currentPeriod);
    return currentPeriod;
  }
}

// Consistent period navigation across modules
function navigatePeriod(currentPeriod, delta) {
  const { year, month } = parsePeriod(currentPeriod);
  const d = new Date(year, month - 1 + delta, 1);
  const newPeriod = toPeriod(d.getFullYear(), d.getMonth() + 1);
  // Use page-specific key
  const page = getCurrentPage();
  const key = `period_${page}`;
  localStorage.setItem(key, newPeriod);
  return newPeriod;
}
