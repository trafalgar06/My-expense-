/**
 * BOOTSTRAP INITIALIZER
 * Validates, maps, and executes page-specific initialization.
 * Served as the single module entry point.
 */
import './theme.js';
import './utils.js';
import './storage.js';
import './audit.js';
import './sidebar.js';
import './modal.js';
import './charts.js';

import { loadStore } from './storage.js';
import { initializeDashboard } from './dashboard.js';
import { initializeExpensesPage } from './expenses.js';
import { initializeReportsPage } from './reports.js';
import { initializeSettingsPage } from './settings.js';

function bootstrap() {
  console.log('Bootstrap: Initializing application as ES Modules...');

  // Auto-set current period to today's month/year if none is stored
  const today = new Date();
  const todayPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  ['dashboard', 'expenses', 'reports', 'settings'].forEach(p => {
    const key = `period_${p}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, todayPeriod);
    }
  });

  const path = window.location.pathname;
  const page = path.split("/").pop();

  console.log(`Bootstrap: Detected page "${page}"`);

  try {
    loadStore();
  } catch (e) {
    console.error('Bootstrap: Failed to load store', e);
  }

  try {
    if (page === 'dashboard.html' || page === '' || page === 'index.html') {
      initializeDashboard();
    } else if (page === 'expenses.html') {
      initializeExpensesPage();
    } else if (page === 'report.html' || page === 'reports.html') {
      initializeReportsPage();
    } else if (page === 'setting.html' || page === 'settings.html') {
      initializeSettingsPage();
    } else {
      console.warn(`Bootstrap: No specific init function mapped for "${page}"`);
    }
  } catch (err) {
    console.error('Bootstrap: Critical initialization error', err);
  }
}

// Single Entry Point
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}

// PWA Registration
if ('serviceWorker' in navigator) {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (let registration of registrations) {
        registration.unregister().then(() => {
          console.log('SW: Unregistered active service worker for localhost development');
        });
      }
    });
    if (window.caches) {
      caches.keys().then(keys => {
        keys.forEach(key => caches.delete(key));
      });
    }
  } else {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.error('SW registration failed:', err));
  }
}

// Install Prompt Handler
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.installPrompt = e;
  console.log('PWA: Install prompt captured');
  if (window.showInstallButton) {
    window.showInstallButton();
  }
});

window.addEventListener('appinstalled', () => {
  console.log('PWA: App installed');
  window.installPrompt = null;
  const btn = document.getElementById('install-app-btn');
  if (btn) btn.classList.add('hidden');
});
