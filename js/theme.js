// ========== Theme Management ==========
<<<<<<< HEAD
//
// THEME_STORAGE_KEY stores the user's PREFERENCE: 'light' | 'dark' | 'auto'.
// The <html data-theme> attribute always holds the RESOLVED value actually
// painted on screen ('light' or 'dark' — 'auto' is never written there).
//
// Previously, choosing "Auto" in Settings resolved it to light/dark ONCE
// and only that resolved value was ever saved, so "Auto" behaved like a
// one-time snapshot of the OS theme rather than staying in sync with it.
// There was also no listener for OS theme changes at all. This version
// keeps the raw preference persisted, resolves it fresh every time it's
// applied, and listens for live OS theme changes while 'auto' is active.
//
// This file is also now the single place that writes theme state, so the
// sidebar's quick light/dark buttons (which call window.setTheme directly)
// and the full Settings page (which calls window.setTheme via
// updateTheme()) can no longer disagree about what's currently selected —
// previously the sidebar buttons updated localStorage only and never told
// window.store.settings.theme, so Settings could show a stale/wrong
// selection after using the sidebar toggle.
const ACCENT_STORAGE_KEY = 'exp_tracker_accent';
const THEME_STORAGE_KEY = 'exp_tracker_theme';

const darkMediaQuery = (typeof window !== 'undefined' && window.matchMedia)
  ? window.matchMedia('(prefers-color-scheme: dark)')
  : null;

// Resolves a preference ('light' | 'dark' | 'auto') to what should actually
// be painted right now.
export function resolveTheme(preference) {
  if (preference === 'auto') {
    return (darkMediaQuery && darkMediaQuery.matches) ? 'dark' : 'light';
  }
  return preference === 'dark' ? 'dark' : 'light';
}

function paintTheme(effectiveTheme, withTransition) {
  const root = document.documentElement;
  if (!withTransition) {
    root.style.setProperty('--transition-theme', 'none');
  }
  root.setAttribute('data-theme', effectiveTheme);
  if (!withTransition) {
    setTimeout(() => {
      root.style.removeProperty('--transition-theme');
    }, 50);
  }
}

// Initialize theme on page load
export function initTheme() {
  const savedPreference = localStorage.getItem(THEME_STORAGE_KEY) || 'auto';
  paintTheme(resolveTheme(savedPreference), false);
  localStorage.setItem(THEME_STORAGE_KEY, savedPreference);
  initAccent();

  // While the preference is 'auto', follow OS theme changes live instead
  // of freezing at whatever the OS happened to be set to on last load.
  if (darkMediaQuery) {
    const onSystemThemeChange = () => {
      const currentPreference = localStorage.getItem(THEME_STORAGE_KEY) || 'auto';
      if (currentPreference === 'auto') {
        paintTheme(resolveTheme('auto'), true);
      }
    };
    if (darkMediaQuery.addEventListener) {
      darkMediaQuery.addEventListener('change', onSystemThemeChange);
    } else if (darkMediaQuery.addListener) {
      darkMediaQuery.addListener(onSystemThemeChange); // Safari <14
    }
  }
=======
const ACCENT_STORAGE_KEY = 'exp_tracker_accent';
const THEME_STORAGE_KEY = 'exp_tracker_theme';

// Initialize theme on page load
export function initTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = savedTheme || (prefersDark ? 'dark' : 'light');

  setTheme(theme, false);
  initAccent();
>>>>>>> f46d71631115c637724f5b7b342a2629e1f1d80d
}

export function initAccent() {
  const savedAccent = localStorage.getItem(ACCENT_STORAGE_KEY) || 'blue';
  setAccent(savedAccent);
}

export function setAccent(color) {
  document.documentElement.setAttribute('data-accent', color);
  localStorage.setItem(ACCENT_STORAGE_KEY, color);
}

<<<<<<< HEAD
// Sets the theme PREFERENCE ('light' | 'dark' | 'auto') from any entry
// point (Settings page buttons, sidebar quick-toggle, cross-tab sync) and
// keeps every source of truth — localStorage, the painted attribute, and
// window.store.settings.theme — in agreement.
export function setTheme(preference, withTransition = true) {
  const oldPreference = localStorage.getItem(THEME_STORAGE_KEY) || 'auto';

  localStorage.setItem(THEME_STORAGE_KEY, preference);
  paintTheme(resolveTheme(preference), withTransition);

  if (window.store && window.store.settings && window.store.settings.theme !== preference) {
    window.store.settings.theme = preference;
    if (window.saveStore) window.saveStore();
  }

  if (oldPreference !== preference && window.auditLog) {
    window.auditLog.logThemeChange(oldPreference, preference);
  }
}

// Toggle between light and dark theme (used by the simple header toggle
// button). Toggling always picks an explicit theme, stepping out of
// 'auto' if that was the active preference.
export function toggleTheme() {
  const currentEffective = document.documentElement.getAttribute('data-theme');
  const newTheme = currentEffective === 'dark' ? 'light' : 'dark';
  setTheme(newTheme, true);
}

// Get current effective (painted) theme
=======
// Set theme with optional transition
export function setTheme(theme, withTransition = true) {
  const root = document.documentElement;

  // Disable transitions temporarily if needed
  if (!withTransition) {
    root.style.setProperty('--transition-theme', 'none');
  }

  root.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);

  // Re-enable transitions after a brief delay
  if (!withTransition) {
    setTimeout(() => {
      root.style.removeProperty('--transition-theme');
    }, 50);
  }
}

// Toggle between light and dark theme
export function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme, true);
}

// Get current theme
>>>>>>> f46d71631115c637724f5b7b342a2629e1f1d80d
export function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'light';
}

// Initialize theme immediately
initTheme();

// Export functions that need to be accessible globally
window.toggleTheme = toggleTheme;
window.getCurrentTheme = getCurrentTheme;
window.setAccent = setAccent;
window.setTheme = setTheme;
<<<<<<< HEAD
window.resolveTheme = resolveTheme;
=======
>>>>>>> f46d71631115c637724f5b7b342a2629e1f1d80d

// Listen for storage changes (cross-tab synchronization)
window.addEventListener('storage', (e) => {
  if (e.key === THEME_STORAGE_KEY) {
<<<<<<< HEAD
    paintTheme(resolveTheme(e.newValue || 'auto'), false);
=======
    setTheme(e.newValue, false);
>>>>>>> f46d71631115c637724f5b7b342a2629e1f1d80d
  }
});
