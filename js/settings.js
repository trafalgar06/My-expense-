// ========== Settings Page Logic ==========

document.addEventListener('DOMContentLoaded', () => {
  loadStore();
  loadCurrentSettings();
  bindSettingsEvents();
});

function loadCurrentSettings() {
  const settings = window.store.settings || {};
  
  // Load theme setting
  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) {
    themeSelect.value = settings.theme || 'light';
  }
  
  // Load currency setting
  const currencySelect = document.getElementById('currency-select');
  if (currencySelect) {
    currencySelect.value = settings.currency || 'INR';
  }
  
  // Load period setting
  const periodSelect = document.getElementById('period-select');
  if (periodSelect) {
    periodSelect.value = settings.defaultPeriod || 'last-used';
  }
  
  // Load cloud sync setting
  const cloudSyncToggle = document.getElementById('cloud-sync-toggle');
  if (cloudSyncToggle) {
    cloudSyncToggle.checked = settings.cloudSync || false;
  }
}

function bindSettingsEvents() {
  // Save settings button
  const saveBtn = document.getElementById('save-settings-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveCurrentSettings);
  }
  
  // Reset settings button
  const resetBtn = document.getElementById('reset-settings-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetToDefaults);
  }
  
  // Live theme change
  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
      setTheme(e.target.value, true);
    });
  }
}

function saveCurrentSettings() {
  const themeSelect = document.getElementById('theme-select');
  const currencySelect = document.getElementById('currency-select');
  const periodSelect = document.getElementById('period-select');
  const cloudSyncToggle = document.getElementById('cloud-sync-toggle');
  
  const newSettings = {
    theme: themeSelect ? themeSelect.value : 'light',
    currency: currencySelect ? currencySelect.value : 'INR',
    defaultPeriod: periodSelect ? periodSelect.value : 'last-used',
    cloudSync: cloudSyncToggle ? cloudSyncToggle.checked : false
  };
  
  // Save to store
  saveSettings(newSettings);
  
  // Apply theme immediately
  setTheme(newSettings.theme, true);
  
  // Show success message
  const lastAction = document.getElementById('last-action');
  if (lastAction) {
    lastAction.textContent = '✅ Settings saved successfully!';
    lastAction.style.color = 'var(--success)';
    
    setTimeout(() => {
      lastAction.textContent = 'Configure your preferences above';
      lastAction.style.color = 'var(--text-tertiary)';
    }, 3000);
  }
}

function resetToDefaults() {
  if (!confirm('Reset all settings to default values?')) return;
  
  const defaultSettings = {
    theme: 'light',
    currency: 'INR',
    defaultPeriod: 'last-used',
    cloudSync: false
  };
  
  saveSettings(defaultSettings);
  loadCurrentSettings();
  setTheme('light', true);
  
  const lastAction = document.getElementById('last-action');
  if (lastAction) {
    lastAction.textContent = '🔄 Settings reset to defaults';
    lastAction.style.color = 'var(--info)';
    
    setTimeout(() => {
      lastAction.textContent = 'Configure your preferences above';
      lastAction.style.color = 'var(--text-tertiary)';
    }, 3000);
  }
}
