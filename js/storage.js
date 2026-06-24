// ========== Unified Global Storage ==========
// Schema v1: original (categories, goals, savingsGoals, transactions, settings)
// Schema v2: removed categories, goals, savingsGoals. Added categoryLimits, recurringTransactions, carryOver
// Schema v3: added accounts (bank/cash/savings running balances) and a transfers log.
//            Every pre-existing income/expense transaction is auto-tagged account: "bank"
//            on migration, and account balances are recalculated from full transaction history.

import { generateUUID, parsePeriod, safeJSONParse } from './utils.js';

const STORAGE_KEY = "exp_tracker_v2";
const SETTINGS_KEY = "exp_tracker_settings";

if (!window.store) window.store = {};
export let store = window.store;

// Default settings
const DEFAULT_SETTINGS = {
  theme: "light",
  currency: "INR",
  defaultPeriod: "last-used",
  cloudSync: false,
  auditEnabled: false
};

export function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let data = raw ? JSON.parse(raw) : {};

    // SAFE MIGRATION: Detect old structure and upgrade
    if (!data.periods && !data.settings) {
      console.log("Migrating old data structure to new format...");
      
      // Clean up orphaned keys
      localStorage.removeItem("categories");
      localStorage.removeItem("goals");
      localStorage.removeItem("savingsGoals");

      const oldData = { ...data };
      data = {
        periods: {},
        settings: loadSettings()
      };

      for (const key in oldData) {
        if (key.match(/^\d{4}-\d{2}$/)) {
          data.periods[key] = {
            budget: oldData[key].budget || 0,
            added: oldData[key].added || 0,
            expenses: (oldData[key].expenses || []).map(e => {
              if (!e.date) {
                const d = new Date(e.timestamp);
                e.date = d.toLocaleDateString("en-CA");
              }
              return {
                id: e.id || generateUUID(),
                name: e.name,
                amount: e.amount,
                category: e.category || "Other",
                date: e.date,
                timestamp: e.timestamp
              };
            }),
            income: (oldData[key].income || []).map(i => {
              if (!i.date) {
                const d = new Date(i.timestamp);
                i.date = d.toLocaleDateString("en-CA");
              }
              return {
                id: i.id || generateUUID(),
                source: i.source,
                amount: i.amount,
                category: i.category || "Other",
                date: i.date,
                timestamp: i.timestamp
              };
            })
          };
        }
      }

      window.store = data;
      store = data;
      migrateToAccountsSchema();
      saveStore();
      console.log("Migration complete!");
    } else {
      window.store = data;
      store = data;
      if (!window.store.settings) {
        window.store.settings = loadSettings();
      }

      for (const periodKey in window.store.periods) {
        const period = window.store.periods[periodKey];
        if (period.expenses) {
          period.expenses = period.expenses.map(e => {
            if (!e.date) {
              const d = new Date(e.timestamp);
              e.date = d.toLocaleDateString("en-CA");
            }
            return e;
          });
        }
        if (period.income) {
          period.income = period.income.map(i => {
            if (!i.date) {
              const d = new Date(i.timestamp);
              i.date = d.toLocaleDateString("en-CA");
            }
            return i;
          });
        }
      }

      migrateToAccountsSchema();
    }
  } catch (e) {
    console.error("Error loading store:", e);
    window.store = {
      periods: {},
      settings: loadSettings()
    };
    store = window.store;
  }
}

export function saveStore() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.store));
  } catch (e) {
    console.error("CRITICAL: Failed to save data to localStorage.", e);
    const isQuotaError = e && (e.name === "QuotaExceededError" || e.code === 22 || e.code === 1014);
    const message = isQuotaError
      ? "Your browser's storage is full, so this change could NOT be saved. Please export a backup from Settings, then free up space (e.g. clear old browser data) before continuing."
      : "This change could NOT be saved to your device. Your browser may be blocking storage (private/incognito mode, or a privacy setting). Please export a backup from Settings as soon as possible.";
    if (typeof window !== "undefined" && typeof window.alert === "function") {
      window.alert(message);
    }
    window.lastSaveFailed = true;
    return false;
  }

  if (window.store.settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(window.store.settings));
    } catch (e) {
      console.error("Failed to save settings to localStorage.", e);
    }
  }

  window.lastSaveFailed = false;
  return true;
}

export function loadSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : { ...DEFAULT_SETTINGS };
  } catch (e) {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  window.store.settings = { ...window.store.settings, ...settings };
  saveStore();
}

// ========== Schema v3: Accounts (Bank / Cash / Savings) ==========

function migrateToAccountsSchema() {
  let needsSave = false;

  if (!window.store.accounts) {
    window.store.accounts = {
      bank: { balance: 0 },
      cash: { balance: 0 },
      savings: { balance: 0 }
    };
    needsSave = true;
  }

  if (!window.store.transfers) {
    window.store.transfers = [];
    needsSave = true;
  }

  // Tag any transaction missing an account (pre-v3 data) as "bank",
  // then recompute running balances from full transaction history.
  let taggedAny = false;
  for (const periodKey in window.store.periods || {}) {
    const period = window.store.periods[periodKey];
    (period.expenses || []).forEach(e => {
      if (!e.account) {
        e.account = "bank";
        taggedAny = true;
      }
    });
    (period.income || []).forEach(i => {
      if (!i.account) {
        i.account = "bank";
        taggedAny = true;
      }
    });
  }

  if (taggedAny) {
    needsSave = true;
  }

  // Recalculate bank/cash/savings balances from full history whenever we
  // just tagged legacy data, so balances reflect what's actually recorded.
  if (taggedAny) {
    let bankBalance = 0;
    let cashBalance = 0;
    let savingsBalance = 0;
    for (const periodKey in window.store.periods || {}) {
      const period = window.store.periods[periodKey];
      (period.income || []).forEach(i => {
        if (i.account === "cash") cashBalance += i.amount;
        else if (i.account === "savings") savingsBalance += i.amount;
        else bankBalance += i.amount;
      });
      (period.expenses || []).forEach(e => {
        if (e.account === "cash") cashBalance -= e.amount;
        else if (e.account === "savings") savingsBalance -= e.amount;
        else bankBalance -= e.amount;
      });
    }
    window.store.accounts.bank.balance = bankBalance;
    window.store.accounts.cash.balance = cashBalance;
    window.store.accounts.savings.balance = savingsBalance;
  }

  if (needsSave) {
    saveStore();
  }
}

export function getAccountBalance(accountKey) {
  if (!window.store.accounts || !window.store.accounts[accountKey]) return 0;
  return window.store.accounts[accountKey].balance;
}

export function adjustAccountBalance(accountKey, delta) {
  if (!window.store.accounts) {
    window.store.accounts = { bank: { balance: 0 }, cash: { balance: 0 }, savings: { balance: 0 } };
  }
  if (!window.store.accounts[accountKey]) {
    window.store.accounts[accountKey] = { balance: 0 };
  }
  window.store.accounts[accountKey].balance += delta;
  saveStore();
}

export function recordTransfer(fromAccount, toAccount, amount, note) {
  if (!window.store.accounts) {
    window.store.accounts = { bank: { balance: 0 }, cash: { balance: 0 }, savings: { balance: 0 } };
  }
  if (!window.store.transfers) {
    window.store.transfers = [];
  }
  if (!window.store.accounts[fromAccount] || !window.store.accounts[toAccount]) {
    return { success: false, error: "Invalid account" };
  }
  if (fromAccount === toAccount) {
    return { success: false, error: "Cannot transfer to the same account" };
  }
  if (amount <= 0 || isNaN(amount)) {
    return { success: false, error: "Invalid amount" };
  }
  if (window.store.accounts[fromAccount].balance < amount) {
    return { success: false, error: "Insufficient balance in source account" };
  }

  window.store.accounts[fromAccount].balance -= amount;
  window.store.accounts[toAccount].balance += amount;

  const transfer = {
    id: generateUUID(),
    fromAccount,
    toAccount,
    amount,
    note: note || "",
    date: new Date().toLocaleDateString("en-CA"),
    timestamp: Date.now()
  };
  window.store.transfers.push(transfer);
  saveStore();

  return { success: true, transfer };
}

export function reconcileCash(actualAmount) {
  if (!window.store.accounts) {
    window.store.accounts = { bank: { balance: 0 }, cash: { balance: 0 }, savings: { balance: 0 } };
  }
  if (isNaN(actualAmount) || actualAmount < 0) {
    return { success: false, error: "Invalid amount" };
  }

  const currentCash = window.store.accounts.cash.balance;
  const difference = actualAmount - currentCash;

  if (!window.store.transfers) {
    window.store.transfers = [];
  }

  window.store.transfers.push({
    id: generateUUID(),
    fromAccount: "adjustment",
    toAccount: "cash",
    amount: difference,
    note: "Cash reconciliation",
    date: new Date().toLocaleDateString("en-CA"),
    timestamp: Date.now()
  });

  window.store.accounts.cash.balance = actualAmount;
  saveStore();

  return { success: true, difference };
}

export function ensurePeriod(p) {
  if (!window.store.periods) {
    window.store.periods = {};
  }
  if (!window.store.periods[p]) {
    window.store.periods[p] = {
      budget: 0,
      added: 0,
      expenses: [],
      income: []
    };
  } else {
    // Repair any existing period that's missing required fields —
    // this can happen with very old data or partial writes — so that
    // .map()/.reduce() calls elsewhere never throw on undefined.
    const period = window.store.periods[p];
    if (!Array.isArray(period.expenses)) period.expenses = [];
    if (!Array.isArray(period.income)) period.income = [];
    if (typeof period.budget !== "number" || isNaN(period.budget)) period.budget = 0;
    if (typeof period.added !== "number" || isNaN(period.added)) period.added = 0;
  }
  generateRecurringTransactions(p);
}

export function generateRecurringTransactions(targetPeriod) {
  const templates = safeJSONParse("recurringTransactions", []);
  if (templates.length === 0) return;

  const periodData = window.store.periods[targetPeriod];
  if (!periodData) return;

  const { year, month } = parsePeriod(targetPeriod);
  const firstDateOfPeriod = new Date(year, month - 1, 1);
  const lastDateOfPeriod = new Date(year, month, 0);

  function formatDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  let modified = false;

  templates.forEach(tpl => {
    const startVal = new Date(tpl.startDate);
    if (startVal > lastDateOfPeriod) return;

    const dates = [];
    if (tpl.frequency === "Daily") {
      const daysCount = lastDateOfPeriod.getDate();
      for (let day = 1; day <= daysCount; day++) {
        const d = new Date(year, month - 1, day);
        if (d >= startVal) {
          dates.push(formatDate(d));
        }
      }
    } else if (tpl.frequency === "Weekly") {
      let d = new Date(startVal);
      while (d < firstDateOfPeriod) {
        d.setDate(d.getDate() + 7);
      }
      while (d <= lastDateOfPeriod) {
        if (d >= startVal) {
          dates.push(formatDate(d));
        }
        d.setDate(d.getDate() + 7);
      }
    } else if (tpl.frequency === "Monthly") {
      const targetDay = startVal.getDate();
      const lastDayOfTargetMonth = lastDateOfPeriod.getDate();
      const actualDay = Math.min(targetDay, lastDayOfTargetMonth);
      const d = new Date(year, month - 1, actualDay);
      if (d >= startVal) {
        dates.push(formatDate(d));
      }
    }

    dates.forEach(dateStr => {
      const account = tpl.account || "bank";
      if (tpl.type === "expense") {
        const exists = periodData.expenses.some(e => e.recurringTemplateId === tpl.id && e.date === dateStr);
        if (!exists) {
          const newExpense = {
            id: generateUUID(),
            name: tpl.name,
            amount: tpl.amount,
            category: tpl.category || "Other",
            date: dateStr,
            timestamp: new Date(dateStr + "T12:00:00").getTime(),
            recurringTemplateId: tpl.id,
            account: account
          };
          periodData.expenses.push(newExpense);
          adjustAccountBalance(account, -tpl.amount);
          modified = true;
          if (window.auditLog) {
            window.auditLog.logAddExpense(newExpense);
          }
        }
      } else if (tpl.type === "income") {
        const exists = periodData.income.some(i => i.recurringTemplateId === tpl.id && i.date === dateStr);
        if (!exists) {
          const newIncome = {
            id: generateUUID(),
            source: tpl.name,
            amount: tpl.amount,
            category: "Income",
            date: dateStr,
            timestamp: new Date(dateStr + "T12:00:00").getTime(),
            recurringTemplateId: tpl.id,
            account: account
          };
          periodData.income.push(newIncome);
          periodData.added += tpl.amount;
          adjustAccountBalance(account, tpl.amount);
          modified = true;
          if (window.auditLog) {
            window.auditLog.logAddIncome(newIncome);
          }
        }
      }
    });
  });

  if (modified) {
    saveStore();
  }
}

export function getPeriodData(period) {
  ensurePeriod(period);
  return window.store.periods[period];
}

// Bind to window for compatibility
window.loadStore = loadStore;
window.saveStore = saveStore;
window.loadSettings = loadSettings;
window.saveSettings = saveSettings;
window.ensurePeriod = ensurePeriod;
window.getPeriodData = getPeriodData;
window.generateRecurringTransactions = generateRecurringTransactions;
window.getAccountBalance = getAccountBalance;
window.adjustAccountBalance = adjustAccountBalance;
window.recordTransfer = recordTransfer;
window.reconcileCash = reconcileCash;