// ========== Unified Global Storage ==========
const STORAGE_KEY = "exp_tracker_v2";
const SETTINGS_KEY = "exp_tracker_settings";

if (!window.store) window.store = {};

// Default settings
const DEFAULT_SETTINGS = {
  theme: "light",
  currency: "INR",
  defaultPeriod: "last-used",
  cloudSync: false,
  categories: ["Food", "Transport", "Shopping", "Entertainment", "Healthcare", "Education", "Bills", "Other"]
};

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let data = raw ? JSON.parse(raw) : {};

    // SAFE MIGRATION: Detect old structure and upgrade
    if (!data.periods && !data.settings) {
      // Old structure detected - migrate safely
      console.log("Migrating old data structure to new format...");
      const oldData = { ...data };
      data = {
        periods: {},
        settings: loadSettings()
      };

      // MIGRATION: Add date field to all existing items
      // Migrate all old periods to new structure
      for (const key in oldData) {
        if (key.match(/^\d{4}-\d{2}$/)) {
          // This is a period key like "2025-01"
          data.periods[key] = {
            budget: oldData[key].budget || 0,
            added: oldData[key].added || 0,
            expenses: (oldData[key].expenses || []).map(e => {
              // SAFETY MIGRATION: Add date field if missing
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
              // SAFETY MIGRATION: Add date field if missing
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

      // Save migrated data
      window.store = data;
      saveStore();
      console.log("Migration complete!");
    } else {
      // New structure already in place
      window.store = data;
      if (!window.store.settings) {
        window.store.settings = loadSettings();
      }
      if (!window.store.categories) {
        window.store.categories = [...DEFAULT_SETTINGS.categories];
      }

      // SAFETY MIGRATION: Add date field to all existing items in new structure
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
    }
  } catch (e) {
    console.error("Error loading store:", e);
    window.store = {
      periods: {},
      settings: loadSettings()
    };
  }
}

function saveStore() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(window.store));
  // Also save settings separately for quick access
  if (window.store.settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(window.store.settings));
  }
}

function loadSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : { ...DEFAULT_SETTINGS };
  } catch (e) {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings) {
  window.store.settings = { ...window.store.settings, ...settings };
  saveStore();
}

function ensurePeriod(p) {
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
  }
}

// Helper to get period data (backward compatible)
function getPeriodData(period) {
  ensurePeriod(period);
  return window.store.periods[period];
}