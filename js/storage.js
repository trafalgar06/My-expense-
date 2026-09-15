// ========== Unified Global Storage ==========
// Schema v1: original (categories, goals, savingsGoals, transactions, settings)
// Schema v2: removed categories, goals, savingsGoals. Added categoryLimits, recurringTransactions, carryOver
// Schema v3: added accounts (bank/cash/savings running balances) and a transfers log.
//            Every pre-existing income/expense transaction is auto-tagged account: "bank"
//            on migration, and account balances are recalculated from full transaction history.

<<<<<<< HEAD
import { generateUUID, parsePeriod, toPeriod, safeJSONParse, roundCurrency } from './utils.js';

const STORAGE_KEY = "exp_tracker_v2";
const SETTINGS_KEY = "exp_tracker_settings";
// These two are historically stored as their own raw localStorage keys
// (see generateRecurringTransactions / settings.js) rather than inside
// window.store, so backupData()/importData() have to be told about them
// explicitly or a restore silently drops all limits and recurring rules.
const SIDE_STORAGE_KEYS = ["categoryLimits", "recurringTransactions", "recurringSkips"];
=======
import { generateUUID, parsePeriod, safeJSONParse } from './utils.js';

const STORAGE_KEY = "exp_tracker_v2";
const SETTINGS_KEY = "exp_tracker_settings";
>>>>>>> f46d71631115c637724f5b7b342a2629e1f1d80d

if (!window.store) window.store = {};
export let store = window.store;

// Default settings
const DEFAULT_SETTINGS = {
<<<<<<< HEAD
  theme: "auto",
=======
  theme: "light",
>>>>>>> f46d71631115c637724f5b7b342a2629e1f1d80d
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
<<<<<<< HEAD
    window.store.accounts.bank.balance = roundCurrency(bankBalance);
    window.store.accounts.cash.balance = roundCurrency(cashBalance);
    window.store.accounts.savings.balance = roundCurrency(savingsBalance);
=======
    window.store.accounts.bank.balance = bankBalance;
    window.store.accounts.cash.balance = cashBalance;
    window.store.accounts.savings.balance = savingsBalance;
>>>>>>> f46d71631115c637724f5b7b342a2629e1f1d80d
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
<<<<<<< HEAD
  // Round after every mutation so tiny binary floating-point errors
  // (e.g. 0.1 + 0.2 !== 0.3) never accumulate across many transactions.
  // Without this, the raw stored balance can drift a fraction of a paisa
  // below the rounded amount actually shown on screen.
  window.store.accounts[accountKey].balance = roundCurrency(window.store.accounts[accountKey].balance + delta);
=======
  window.store.accounts[accountKey].balance += delta;
>>>>>>> f46d71631115c637724f5b7b342a2629e1f1d80d
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
<<<<<<< HEAD

  const roundedAmount = roundCurrency(amount);
  const sourceBalance = window.store.accounts[fromAccount].balance;

  // Compare with a half-paisa tolerance, not a strict "<". The amount the
  // user types is read off the rounded, displayed balance (e.g. "5000.00"),
  // while the raw stored balance can be a hair lower due to floating-point
  // drift from many past additions/subtractions (e.g. 4999.999999999998).
  // A strict comparison would reject "transfer everything" even though the
  // account visibly holds exactly that amount. 0.005 is half of the
  // smallest unit we display (1 paisa/cent), so this never allows a
  // transfer that's actually short by a real amount of money.
  if (sourceBalance < roundedAmount - 0.005) {
    return { success: false, error: "Insufficient balance in source account" };
  }

  // Clamp to the real available balance so we never push it negative due
  // to the tolerance above (e.g. asking to move 5000.00 out of an account
  // truly holding 4999.999999999998 sends the full 4999.999999999998,
  // not slightly more than what's there).
  const amountToMove = Math.min(roundedAmount, sourceBalance);

  window.store.accounts[fromAccount].balance = roundCurrency(sourceBalance - amountToMove);
  window.store.accounts[toAccount].balance = roundCurrency(window.store.accounts[toAccount].balance + amountToMove);
=======
  if (window.store.accounts[fromAccount].balance < amount) {
    return { success: false, error: "Insufficient balance in source account" };
  }

  window.store.accounts[fromAccount].balance -= amount;
  window.store.accounts[toAccount].balance += amount;
>>>>>>> f46d71631115c637724f5b7b342a2629e1f1d80d

  const transfer = {
    id: generateUUID(),
    fromAccount,
    toAccount,
<<<<<<< HEAD
    amount: amountToMove,
=======
    amount,
>>>>>>> f46d71631115c637724f5b7b342a2629e1f1d80d
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
<<<<<<< HEAD
  const roundedActual = roundCurrency(actualAmount);
  const difference = roundCurrency(roundedActual - currentCash);
=======
  const difference = actualAmount - currentCash;
>>>>>>> f46d71631115c637724f5b7b342a2629e1f1d80d

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

<<<<<<< HEAD
  window.store.accounts.cash.balance = roundedActual;
=======
  window.store.accounts.cash.balance = actualAmount;
>>>>>>> f46d71631115c637724f5b7b342a2629e1f1d80d
  saveStore();

  return { success: true, difference };
}

<<<<<<< HEAD
// ========== Full Backup / Restore ==========
// categoryLimits and recurringTransactions live in their own raw
// localStorage keys (not inside window.store), so a naive
// JSON.stringify(window.store) backup silently drops them, and restoring
// that backup on another device/browser loses every category limit and
// recurring transaction rule with no warning. These two helpers are the
// single source of truth for what a "full backup" contains, so Settings'
// backup/import UI and this schema never drift apart again.
export function getFullBackupData() {
  const data = { ...window.store };
  SIDE_STORAGE_KEYS.forEach(key => {
    data[key] = safeJSONParse(key, key === "categoryLimits" ? {} : []);
  });
  return data;
}

export function restoreFullBackupData(data) {
  if (!data || !data.periods || !data.settings) {
    return { success: false, error: "Invalid backup file" };
  }

  SIDE_STORAGE_KEYS.forEach(key => {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      localStorage.setItem(key, JSON.stringify(data[key]));
    }
  });

  // Keep window.store itself free of the side keys so it matches the
  // shape the rest of the app expects (they're read back out of
  // localStorage directly wherever they're needed).
  const storeOnly = { ...data };
  SIDE_STORAGE_KEYS.forEach(key => delete storeOnly[key]);

  window.store = storeOnly;
  store = window.store;
  saveStore();

  return { success: true };
}

// Returns the immediately preceding calendar month's period key, e.g.
// "2026-03" -> "2026-02", "2026-01" -> "2025-12".
function getPreviousPeriodKey(p) {
  const { year, month } = parsePeriod(p);
  const d = new Date(year, month - 2, 1);
  return toPeriod(d.getFullYear(), d.getMonth() + 1);
}

// When "Carry Over Balance" is enabled in Settings, a brand-new period's
// opening budget is the previous month's net savings (income - expenses),
// which can be negative if the previous month overspent. This only runs
// once, the first time a period is created — editing the budget by hand
// afterwards is never overwritten.
function getCarryOverOpeningBudget(p) {
  const settings = window.store.settings;
  if (!settings || !settings.carryOverEnabled) return 0;

  const prevKey = getPreviousPeriodKey(p);
  const prevPeriod = window.store.periods && window.store.periods[prevKey];
  if (!prevPeriod) return 0;

  const prevIncome = (prevPeriod.income || []).reduce((sum, i) => sum + i.amount, 0) + (prevPeriod.budget || 0);
  const prevExpenses = (prevPeriod.expenses || []).reduce((sum, e) => sum + e.amount, 0);
  return roundCurrency(prevIncome - prevExpenses);
}

=======
>>>>>>> f46d71631115c637724f5b7b342a2629e1f1d80d
export function ensurePeriod(p) {
  if (!window.store.periods) {
    window.store.periods = {};
  }
  if (!window.store.periods[p]) {
    window.store.periods[p] = {
<<<<<<< HEAD
      budget: getCarryOverOpeningBudget(p),
=======
      budget: 0,
>>>>>>> f46d71631115c637724f5b7b342a2629e1f1d80d
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

<<<<<<< HEAD
// Occurrences the user has explicitly deleted, as `${templateId}|${date}`.
// Without this, deleting a generated transaction was pointless: the next
// ensurePeriod() call regenerated it immediately, so recurring rows simply
// could not be removed.
const RECURRING_SKIP_KEY = "recurringSkips";

export function getRecurringSkips() {
  const skips = safeJSONParse(RECURRING_SKIP_KEY, []);
  return Array.isArray(skips) ? skips : [];
}

export function addRecurringSkip(templateId, dateStr) {
  if (!templateId || !dateStr) return;
  const skips = getRecurringSkips();
  const entry = `${templateId}|${dateStr}`;
  if (!skips.includes(entry)) {
    skips.push(entry);
    localStorage.setItem(RECURRING_SKIP_KEY, JSON.stringify(skips));
  }
}

// Stops a recurring rule entirely and clears its now-pointless skips.
export function removeRecurringTemplate(templateId) {
  if (!templateId) return;
  const templates = safeJSONParse("recurringTransactions", []);
  const remaining = templates.filter(t => t.id !== templateId);
  localStorage.setItem("recurringTransactions", JSON.stringify(remaining));

  const skips = getRecurringSkips().filter(s => !s.startsWith(`${templateId}|`));
  localStorage.setItem(RECURRING_SKIP_KEY, JSON.stringify(skips));
}

=======
>>>>>>> f46d71631115c637724f5b7b342a2629e1f1d80d
export function generateRecurringTransactions(targetPeriod) {
  const templates = safeJSONParse("recurringTransactions", []);
  if (templates.length === 0) return;

  const periodData = window.store.periods[targetPeriod];
  if (!periodData) return;

  const { year, month } = parsePeriod(targetPeriod);
  const firstDateOfPeriod = new Date(year, month - 1, 1);
  const lastDateOfPeriod = new Date(year, month, 0);

<<<<<<< HEAD
  // Never materialize a recurring transaction that hasn't happened yet.
  //
  // ensurePeriod() calls this for whatever month is being viewed, so
  // simply clicking "next month" used to generate a full month of
  // not-yet-occurred transactions AND immediately debit them from the
  // real account balances. Browsing six months ahead with one daily
  // rule took a ₹1,00,000 bank balance down to ₹500 and filled every
  // future month with ~31 phantom expenses — money spent purely by
  // looking at a calendar. Recurring entries should appear as each date
  // actually arrives, so generation is capped at today.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Entirely-future period: nothing is due yet.
  if (firstDateOfPeriod > today) return;

  // For the current month this stops at today; for past months the whole
  // month is already behind us, so the month's own end date is the cap.
  const generateUpTo = lastDateOfPeriod < today ? lastDateOfPeriod : today;

=======
>>>>>>> f46d71631115c637724f5b7b342a2629e1f1d80d
  function formatDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  let modified = false;
<<<<<<< HEAD
  const skips = getRecurringSkips();

  templates.forEach(tpl => {
    const startVal = new Date(tpl.startDate);
    startVal.setHours(0, 0, 0, 0);
    if (startVal > generateUpTo) return;

    const dates = [];
    if (tpl.frequency === "Daily") {
      const daysCount = generateUpTo.getDate();
      for (let day = 1; day <= daysCount; day++) {
        const d = new Date(year, month - 1, day);
        if (d >= startVal && d <= generateUpTo) {
=======

  templates.forEach(tpl => {
    const startVal = new Date(tpl.startDate);
    if (startVal > lastDateOfPeriod) return;

    const dates = [];
    if (tpl.frequency === "Daily") {
      const daysCount = lastDateOfPeriod.getDate();
      for (let day = 1; day <= daysCount; day++) {
        const d = new Date(year, month - 1, day);
        if (d >= startVal) {
>>>>>>> f46d71631115c637724f5b7b342a2629e1f1d80d
          dates.push(formatDate(d));
        }
      }
    } else if (tpl.frequency === "Weekly") {
      let d = new Date(startVal);
      while (d < firstDateOfPeriod) {
        d.setDate(d.getDate() + 7);
      }
<<<<<<< HEAD
      while (d <= generateUpTo) {
=======
      while (d <= lastDateOfPeriod) {
>>>>>>> f46d71631115c637724f5b7b342a2629e1f1d80d
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
<<<<<<< HEAD
      if (d >= startVal && d <= generateUpTo) {
=======
      if (d >= startVal) {
>>>>>>> f46d71631115c637724f5b7b342a2629e1f1d80d
        dates.push(formatDate(d));
      }
    }

    dates.forEach(dateStr => {
<<<<<<< HEAD
      // The user deleted this specific occurrence — don't resurrect it.
      if (skips.includes(`${tpl.id}|${dateStr}`)) return;
=======
>>>>>>> f46d71631115c637724f5b7b342a2629e1f1d80d
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
<<<<<<< HEAD
window.reconcileCash = reconcileCash;
window.getFullBackupData = getFullBackupData;
window.restoreFullBackupData = restoreFullBackupData;
=======
window.reconcileCash = reconcileCash;
>>>>>>> f46d71631115c637724f5b7b342a2629e1f1d80d
