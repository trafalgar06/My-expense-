// ========== Theme Management ==========
const THEME_STORAGE_KEY = 'exp_tracker_theme';

// Initialize theme on page load
function initTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = savedTheme || (prefersDark ? 'dark' : 'light');
  
  setTheme(theme, false);
}

// Set theme with optional transition
function setTheme(theme, withTransition = true) {
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
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme, true);
}

// Get current theme
function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'light';
}

// Initialize theme immediately
initTheme();
