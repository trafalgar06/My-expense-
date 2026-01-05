/**
 * BOOTSTRAP INITIALIZER
 * Validates, maps, and executes page-specific initialization.
 * MUST BE LOADED LAST.
 */
(function () {
    'use strict';

    // Global initialization function
    function bootstrap() {
        console.log('Bootstrap: Initializing application...');

        const path = window.location.pathname;
        const page = path.split("/").pop();

        console.log(`Bootstrap: Detected page "${page}"`);

        // Ensure store is loaded first if possible
        if (window.loadStore) {
            try {
                window.loadStore();
            } catch (e) {
                console.error('Bootstrap: Failed to load store', e);
            }
        }

        try {
            // 1. Detect and route
            if (page === 'dashboard.html' || page === '' || page === 'index.html') {
                safeCall('initializeDashboard');
            } else if (page === 'expenses.html') {
                safeCall('initializeExpensesPage');
            } else if (page === 'income.html') {
                safeCall('initializeIncomePage');
            } else if (page === 'report.html' || page === 'reports.html') {
                safeCall('initializeReportsPage');
            } else if (page === 'setting.html' || page === 'settings.html') {
                safeCall('initializeSettingsPage');
            } else if (page === 'goals.html') {
                safeCall('initializeGoalsPage');
            } else if (page === 'categories.html') {
                safeCall('initializeCategoriesPage');
            } else if (page === 'period-selection.html') {
                safeCall('initializePeriodPage');
            } else {
                console.warn(`Bootstrap: No specific init function mapped for "${page}"`);
            }

        } catch (err) {
            console.error('Bootstrap: Critical initialization error', err);
        }
    }

    // Safe execution helper
    function safeCall(fnName) {
        if (typeof window[fnName] === 'function') {
            console.log(`Bootstrap: Calling ${fnName}()`);
            window[fnName]();
        } else {
            console.error(`Bootstrap: Function ${fnName} not found! Check script order.`);
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
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW registered:', reg.scope))
            .catch(err => console.error('SW registration failed:', err));
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

})();
