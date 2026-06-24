// ========== Settings Page Logic ----------
import { loadStore, saveStore, saveSettings } from './storage.js';
import { getUnifiedCategories, getCategoryEmoji, CATEGORY_LIST, escapeHtml, safeJSONParse } from './utils.js';

// Initialize settings page (called from HTML)
export function initializeSettingsPage() {
  loadStore();
  loadCurrentSettings();
  bindSettingsEvents();
}

function loadCurrentSettings() {
  const settings = window.store.settings || {};

  const currentTheme = settings.theme || 'auto';
  updateThemeButtons(currentTheme);

  const currentAccent = settings.accentColor || localStorage.getItem('exp_tracker_accent') || 'blue';
  updateAccentButtons(currentAccent);

  const currencySelect = document.getElementById('currency-setting');
  if (currencySelect) {
    currencySelect.value = settings.currency || 'INR';
  }



  const auditToggle = document.getElementById('audit-logging-toggle');
  const downloadAuditBtn = document.getElementById('download-audit-btn');
  if (auditToggle) {
    auditToggle.checked = !!settings.auditEnabled;
    if (downloadAuditBtn) {
      downloadAuditBtn.style.display = settings.auditEnabled ? 'inline-block' : 'none';
    }
  }

  renderCategorySettings();
}

function bindSettingsEvents() {
  const lightBtn = document.getElementById('light-theme-btn');
  const darkBtn = document.getElementById('dark-theme-btn');
  const autoBtn = document.getElementById('auto-theme-btn');

  if (lightBtn) lightBtn.addEventListener('click', () => updateTheme('light'));
  if (darkBtn) darkBtn.addEventListener('click', () => updateTheme('dark'));
  if (autoBtn) autoBtn.addEventListener('click', () => updateTheme('auto'));

  const selects = ['currency-setting'];
  selects.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', saveSettingsLocally);
    }
  });

  const colorButtons = document.querySelectorAll('.color-option');
  colorButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      const color = this.getAttribute('data-color');
      updateAccentColor(color);
    });
  });

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

  const toggleBtn = document.getElementById('toggle-advanced-settings');
  const content = document.getElementById('advanced-settings-content');
  const arrow = document.getElementById('advanced-settings-arrow');
  if (toggleBtn && content && arrow) {
    toggleBtn.addEventListener('click', () => {
      const isCollapsed = content.style.maxHeight === '0px' || content.style.maxHeight === '' || content.style.maxHeight === '0';
      if (isCollapsed) {
        content.style.maxHeight = '300px';
        content.style.opacity = '1';
        content.style.marginTop = 'var(--space-4)';
        arrow.style.transform = 'rotate(180deg)';
      } else {
        content.style.maxHeight = '0';
        content.style.opacity = '0';
        content.style.marginTop = '0';
        arrow.style.transform = 'rotate(0deg)';
      }
    });
  }

  const auditToggle = document.getElementById('audit-logging-toggle');
  if (auditToggle) {
    auditToggle.addEventListener('change', function () {
      if (!window.store.settings) window.store.settings = {};
      window.store.settings.auditEnabled = this.checked;
      saveStore();
      const downloadBtn = document.getElementById('download-audit-btn');
      if (downloadBtn) {
        downloadBtn.style.display = this.checked ? 'inline-block' : 'none';
      }
    });
  }

  const downloadAuditBtn = document.getElementById('download-audit-btn');
  if (downloadAuditBtn) {
    downloadAuditBtn.addEventListener('click', () => {
      if (window.auditLog && window.auditLog.exportLog) {
        window.auditLog.exportLog();
      }
    });
  }

  const carryToggle = document.getElementById('carry-over-toggle');
  if (carryToggle) {
    carryToggle.addEventListener('change', function () {
      if (!window.store.settings) window.store.settings = {};
      window.store.settings.carryOverEnabled = this.checked;
      saveStore();
    });
  }

  const emojiInput = document.getElementById('new-cat-emoji');
  const emojiPickerContainer = document.getElementById('emoji-picker-container');
  if (emojiInput && emojiPickerContainer) {
    emojiInput.addEventListener('click', function (e) {
      e.stopPropagation();
      const isHidden = emojiPickerContainer.style.display === 'none' || emojiPickerContainer.style.display === '';
      emojiPickerContainer.style.display = isHidden ? 'block' : 'none';
    });

    document.addEventListener('click', function () {
      emojiPickerContainer.style.display = 'none';
    });

    emojiPickerContainer.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    const picker = emojiPickerContainer.querySelector('emoji-picker');
    if (picker) {
      picker.addEventListener('emoji-click', function (event) {
        emojiInput.value = event.detail.unicode;
        emojiPickerContainer.style.display = 'none';
      });
    }
  }

  const addCatBtn = document.getElementById('add-cat-btn');
  if (addCatBtn) {
    addCatBtn.addEventListener('click', function () {
      const nameInput = document.getElementById('new-cat-name');
      const emojiInput = document.getElementById('new-cat-emoji');
      if (!nameInput || !emojiInput) return;

      const name = nameInput.value.trim();
      const emoji = emojiInput.value.trim();

      if (!name) {
        alert('Please enter a category name');
        return;
      }
      if (!emoji) {
        alert('Please select an emoji');
        return;
      }

      const defaults = CATEGORY_LIST || [];
      const settings = window.store.settings || {};
      const custom = settings.customCategories || [];

      if (defaults.includes(name) || custom.some(c => c.name === name)) {
        alert('Category already exists!');
        return;
      }

      if (!settings.customCategories) settings.customCategories = [];
      settings.customCategories.push({ name, emoji });
      saveStore();

      nameInput.value = '';
      emojiInput.value = '';

      renderCategorySettings();
    });
  }
}

function updateTheme(theme) {
  const oldTheme = window.store.settings.theme || 'auto';
  window.store.settings.theme = theme;
  saveStore();

  let effectiveTheme = theme;
  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    effectiveTheme = prefersDark ? 'dark' : 'light';
  }

  if (window.setTheme) {
    window.setTheme(effectiveTheme, true);
  } else {
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }

  updateThemeButtons(theme);

  if (window.auditLog) {
    window.auditLog.logThemeChange(oldTheme, theme);
  }
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

  if (window.setAccent) {
    window.setAccent(color);
  }

  updateAccentButtons(color);
}

function updateAccentButtons(color) {
  const colorButtons = document.querySelectorAll('.color-option');
  colorButtons.forEach(btn => {
    const btnColor = btn.getAttribute('data-color');
    if (btnColor === color) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function saveSettingsLocally() {
  const settings = window.store.settings;
  const currencyEl = document.getElementById('currency-setting');
  if (currencyEl) {
    settings.currency = currencyEl.value;
  }

  saveStore();
}

function backupData() {
  const data = JSON.stringify(window.store, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `DenaroTrack_Backup_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
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
  if (confirm('CRITICAL: This will delete ALL your financial data, including transactions, budgets, category limits, recurring transactions, and settings. This cannot be undone. Are you sure?')) {
    localStorage.clear();
    alert('All data cleared. The page will now reload.');
    window.location.reload();
  }
}

function renderCategorySettings() {
  const limitsList = document.getElementById("category-limits-list");
  if (!limitsList) return;

  limitsList.innerHTML = "";
  const categories = getUnifiedCategories ? getUnifiedCategories() : [];
  const limits = safeJSONParse("categoryLimits", {});

  categories.forEach(cat => {
    const isCustom = !CATEGORY_LIST.includes(cat);
    const emoji = getCategoryEmoji ? getCategoryEmoji(cat) : "📦";
    const limitVal = limits[cat] || "";

    const row = document.createElement("div");
    row.className = "setting-item category-limit-row";

    row.innerHTML = `
      <div class="setting-label">
        <span style="font-size: 24px;">${escapeHtml(emoji)}</span>
        <span class="text-body font-medium">${escapeHtml(cat)}</span>
      </div>
      <div class="category-limit-controls">
        <div class="input-with-symbol category-limit-input-wrap">
          <span class="currency-symbol">${getCurrencySymbol()}</span>
          <input type="number" class="input-field category-limit-input" data-category="${escapeHtml(cat)}" value="${limitVal}" placeholder="No limit">
        </div>
        ${isCustom ? `<button class="btn btn-danger btn-sm delete-cat-btn" data-category="${escapeHtml(cat)}" style="padding: 6px 10px; min-width: auto; height: 42px;">🗑️</button>` : ''}
      </div>
    `;

    limitsList.appendChild(row);
  });

  limitsList.querySelectorAll(".category-limit-input").forEach(input => {
    input.addEventListener("input", function() {
      const cat = this.getAttribute("data-category");
      const val = parseFloat(this.value);
      const currentLimits = safeJSONParse("categoryLimits", {});
      if (isNaN(val) || val <= 0) {
        delete currentLimits[cat];
      } else {
        currentLimits[cat] = val;
      }
      localStorage.setItem("categoryLimits", JSON.stringify(currentLimits));
    });
  });

  limitsList.querySelectorAll(".delete-cat-btn").forEach(btn => {
    btn.addEventListener("click", function() {
      const cat = this.getAttribute("data-category");
      if (confirm(`Are you sure you want to delete custom category "${cat}"?`)) {
        const settings = window.store.settings || {};
        const custom = settings.customCategories || [];
        settings.customCategories = custom.filter(c => c.name !== cat);
        
        const currentLimits = safeJSONParse("categoryLimits", {});
        delete currentLimits[cat];
        localStorage.setItem("categoryLimits", JSON.stringify(currentLimits));

        saveStore();
        renderCategorySettings();
      }
    });
  });
}

function getCurrencySymbol() {
  const settings = window.store.settings || {};
  const currency = settings.currency || 'INR';
  const symbols = { 'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥' };
  return symbols[currency] || '₹';
}

// Export functions that need to be accessible globally
window.initializeSettingsPage = initializeSettingsPage;