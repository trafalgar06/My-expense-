// ========== Unified Global Storage ==========
const STORAGE_KEY = "exp_tracker_v2";
const SETTINGS_KEY = "exp_tracker_settings";

if (!window.store) window.store = {};

// Default settings
const DEFAULT_SETTINGS = {
  theme: "light",
  currency: "INR",
  defaultPeriod: "last-used",
  cloudSync: false
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
      
      // Migrate all old periods to new structure
      for (const key in oldData) {
        if (key.match(/^\d{4}-\d{2}$/)) {
          // This is a period key like "2025-01"
          data.periods[key] = {
            budget: oldData[key].budget || 0,
            added: oldData[key].added || 0,
            expenses: (oldData[key].expenses || []).map(e => ({
              id: e.id || crypto.randomUUID(),
              name: e.name,
              amount: e.amount,
              category: e.category || "Other",
              date: e.date || new Date(e.timestamp).toISOString().split('T')[0],
              timestamp: e.timestamp
            })),
            income: (oldData[key].income || []).map(i => ({
              id: i.id || crypto.randomUUID(),
              source: i.source,
              amount: i.amount,
              category: i.category || "Other",
              date: i.date || new Date(i.timestamp).toISOString().split('T')[0],
              timestamp: i.timestamp
            }))
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

// ========== Cloud Sync Infrastructure (Placeholder) ==========
// These functions are placeholders for future Supabase integration

function uploadStore() {
  // Placeholder for future cloud sync implementation
  // Will upload window.store to Supabase
  console.log("[Cloud Sync] Upload triggered (not implemented yet)");
  return Promise.resolve();
}

function downloadStore() {
  // Placeholder for future cloud sync implementation
  // Will download store from Supabase
  console.log("[Cloud Sync] Download triggered (not implemented yet)");
  return Promise.resolve(null);
}

function syncOnStartup() {
  // Placeholder for future cloud sync implementation
  // Will sync data on app startup if cloudSync is enabled
  const settings = window.store.settings || {};
  if (settings.cloudSync) {
    console.log("[Cloud Sync] Startup sync triggered (not implemented yet)");
  }
  return Promise.resolve();
}
