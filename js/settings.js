// ========== Settings Page Logic ----------
(function () {

  // Initialize settings page (called from HTML)
  function initializeSettingsPage() {
    loadStore();
    loadCurrentSettings();
    bindSettingsEvents();
  }

  function loadCurrentSettings() {
    const settings = window.store.settings || {};

    // Load theme setting (buttons)
    const currentTheme = settings.theme || 'auto';
    updateThemeButtons(currentTheme);

    // Load currency setting
    const currencySelect = document.getElementById('currency-setting');
    if (currencySelect) {
      currencySelect.value = settings.currency || 'INR';
    }

    // Load language setting
    const languageSelect = document.getElementById('language-setting');
    if (languageSelect) {
      languageSelect.value = settings.language || 'en';
    }

    // Load date format setting
    const dateFormatSelect = document.getElementById('date-format-setting');
    if (dateFormatSelect) {
      dateFormatSelect.value = settings.dateFormat || 'MM/DD/YYYY';
    }
  }

  function bindSettingsEvents() {
    // Theme buttons
    const lightBtn = document.getElementById('light-theme-btn');
    const darkBtn = document.getElementById('dark-theme-btn');
    const autoBtn = document.getElementById('auto-theme-btn');

    if (lightBtn) lightBtn.addEventListener('click', () => updateTheme('light'));
    if (darkBtn) darkBtn.addEventListener('click', () => updateTheme('dark'));
    if (autoBtn) autoBtn.addEventListener('click', () => updateTheme('auto'));

    // Select dropdowns
    const selects = ['currency-setting', 'language-setting', 'date-format-setting'];
    selects.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', saveSettingsLocally);
      }
    });

    // Accent colors
    const colorButtons = document.querySelectorAll('.color-option');
    colorButtons.forEach(btn => {
      btn.addEventListener('click', function () {
        const color = this.getAttribute('data-color');
        updateAccentColor(color);
      });
    });

    // Data management
    const backupBtn = document.getElementById('backup-btn');
    if (backupBtn) backupBtn.addEventListener('click', backupData);

    const importBtn = document.getElementById('import-btn');
    if (importBtn) importBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = e => {
        const file = e.target.files[0];
        if (file) importData(file);
      };
      input.click();
    });

    const clearBtn = document.getElementById('clear-data-btn');
    if (clearBtn) clearBtn.addEventListener('click', clearAllData);

    // Account actions
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to log out?')) {
          alert('Logging out...');
        }
      });
    }

    const changePasswordBtn = document.getElementById('change-password-btn');
    if (changePasswordBtn) {
      changePasswordBtn.addEventListener('click', () => {
        alert('Change Password feature coming soon!');
      });
    }

    const editProfileBtn = document.getElementById('edit-profile-btn');
    if (editProfileBtn) {
      editProfileBtn.addEventListener('click', () => {
        alert('Profile verification feature coming soon!');
      });
    }

    // Install App Action
    const installBtn = document.getElementById('settings-install-btn');
    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        if (window.installPrompt) {
          window.installPrompt.prompt();
          const { outcome } = await window.installPrompt.userChoice;
          console.log(`User response to the install prompt: ${outcome}`);
          window.installPrompt = null;
        } else {
          alert("To install DenaroTrack:\n\nChrome: Click the install icon in the address bar.\nSafari (iOS): Tap 'Share' -> 'Add to Home Screen'.");
        }
      });
    }
  }

  function updateTheme(theme) {
    const oldTheme = window.store.settings.theme || 'auto';
    window.store.settings.theme = theme;
    saveStore();

    // Determine effective theme to apply
    let effectiveTheme = theme;
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = prefersDark ? 'dark' : 'light';
    }

    if (window.setTheme) {
      window.setTheme(effectiveTheme, true);
    } else {
      // Fallback
      document.documentElement.setAttribute('data-theme', effectiveTheme);
    }

    updateThemeButtons(theme);

    if (window.auditLog) {
      window.auditLog.logThemeChange(oldTheme, theme);
    }
    showStatus('Theme updated to ' + theme);
  }

  function updateThemeButtons(theme) {
    const buttons = {
      'light': document.getElementById('light-theme-btn'),
      'dark': document.getElementById('dark-theme-btn'),
      'auto': document.getElementById('auto-theme-btn')
    };

    Object.values(buttons).forEach(btn => {
      if (btn) btn.classList.remove('active', 'btn-primary');
    });

    if (buttons[theme]) {
      buttons[theme].classList.add('active', 'btn-primary');
    }
  }

  function updateAccentColor(color) {
    window.store.settings.accentColor = color;
    saveStore();

    // Apply globally using theme.js helper
    if (window.setAccent) {
      window.setAccent(color);
    }

    showStatus('Accent color updated to ' + color);
  }

  function saveSettingsLocally() {
    const settings = window.store.settings;
    settings.currency = document.getElementById('currency-setting').value;
    settings.language = document.getElementById('language-setting').value;
    settings.dateFormat = document.getElementById('date-format-setting').value;

    saveStore();
    showStatus('Settings saved');
  }

  function backupData() {
    const data = JSON.stringify(window.store, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DenaroTrack_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showStatus('Backup created');
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = JSON.parse(e.target.result);
        if (data.periods && data.settings) {
          window.store = data;
          saveStore();
          alert('Data imported successfully! The page will now reload.');
          window.location.reload();
        } else {
          throw new Error('Invalid backup file');
        }
      } catch (err) {
        alert('Error importing data: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  function clearAllData() {
    if (confirm('CRITICAL: This will delete ALL your financial data, goals, and categories. This cannot be undone. Are you sure?')) {
      localStorage.clear();
      alert('All data cleared. The page will now reload.');
      window.location.reload();
    }
  }

  function showStatus(msg) {
    const lastAction = document.getElementById('last-action');
    if (lastAction) {
      lastAction.textContent = '✅ ' + msg;
      lastAction.classList.add('text-success');
      setTimeout(() => {
        lastAction.textContent = 'Configure your preferences above';
        lastAction.classList.remove('text-success');
      }, 3000);
    }
  }

  // Export functions that need to be accessible globally
  window.initializeSettingsPage = initializeSettingsPage;
})();