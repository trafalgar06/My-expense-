// ========== Unified Global Storage ==========
const STORAGE_KEY = "exp_tracker_v2";

if (!window.store) window.store = {};

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    window.store = raw ? JSON.parse(raw) : {};
  } catch (e) {
    window.store = {};
  }
}

function saveStore() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(window.store));
}

function ensurePeriod(p) {
  if (!window.store[p]) {
    window.store[p] = {
      budget: 0,
      added: 0,
      expenses: [],
      income: []
    };
  }
}
