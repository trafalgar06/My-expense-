// ========== Theme Management ==========
const ACCENT_STORAGE_KEY = 'exp_tracker_accent';
const THEME_STORAGE_KEY = 'exp_tracker_theme';

// Initialize theme on page load
export function initTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = savedTheme || (prefersDark ? 'dark' : 'light');

  setTheme(theme, false);
  initAccent();
}

export function initAccent() {
  const savedAccent = localStorage.getItem(ACCENT_STORAGE_KEY) || 'blue';
  setAccent(savedAccent);
}

export function setAccent(color) {
  document.documentElement.setAttribute('data-accent', color);
  localStorage.setItem(ACCENT_STORAGE_KEY, color);
}

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

// Listen for storage changes (cross-tab synchronization)
window.addEventListener('storage', (e) => {
  if (e.key === THEME_STORAGE_KEY) {
    setTheme(e.newValue, false);
  }
});
