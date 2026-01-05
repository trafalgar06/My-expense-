// ===== DESKTOP-FIRST SIDEBAR (FINAL FIX) =====

(function () {
  const MOBILE_TOGGLE_ID = "mobile-menu-btn";
  let outsideClickAdded = false;

  function isDesktop() {
    return window.innerWidth >= 1024;
  }

  function buildNav() {
    const current = window.location.pathname.split("/").pop();
    const items = [
      { name: "Dashboard", href: "dashboard.html", icon: "📊" },
      { name: "Transactions", href: "expenses.html", icon: "💸" },
      { name: "Categories", href: "categories.html", icon: "🏷️" },
      { name: "Reports", href: "report.html", icon: "📈" },
      { name: "Goals", href: "goals.html", icon: "🎯" },
      { name: "Settings", href: "setting.html", icon: "⚙️" }
    ];

    return items.map(i => {
      if (i.disabled) {
        return `
          <div class="sidebar-item sidebar-disabled" title="Coming Soon">
            <span class="sidebar-icon">${i.icon}</span>
            <span class="sidebar-label">${i.name} (Coming Soon)</span>
          </div>
        `;
      } else {
        return `
          <a href="${i.href}" class="sidebar-item ${current === i.href ? "sidebar-item-active" : ""}" onclick="logNavigationEvent('${i.name}', '${i.href}')">
            <span class="sidebar-icon">${i.icon}</span>
            <span class="sidebar-label">${i.name}</span>
          </a>
        `;
      }
    }).join("");
  }

  function buildSidebarHTML() {
    return `
      <aside class="sidebar sidebar-expanded" id="app-sidebar">
        <div class="sidebar-header">
          <h2 class="sidebar-title">DenaroTrack</h2>
          <button class="sidebar-collapse-btn" aria-label="Collapse sidebar">
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
          </button>
        </div>

        <nav class="sidebar-nav">
          ${buildNav()}
        </nav>

        <div class="sidebar-footer">
          <div class="sidebar-theme-controls">
            <button onclick="window.setTheme('light', true)" class="theme-btn-light" aria-label="Light Mode" title="Light Mode">
              ☀️
            </button>
            <button onclick="window.setTheme('dark', true)" class="theme-btn-dark" aria-label="Dark Mode" title="Dark Mode">
              🌙
            </button>
          </div>
          <button id="install-app-btn" class="sidebar-btn-primary mt-4 w-full">
            Install App
          </button>
        </div>
      </aside>
    `;
  }

  function createMobileToggleIfNeeded(sidebarContainer, sidebar) {
    if (isDesktop()) {
      const old = document.getElementById(MOBILE_TOGGLE_ID);
      if (old) old.remove();
      return;
    }

    let btn = document.getElementById(MOBILE_TOGGLE_ID);
    if (!btn) {
      btn = document.createElement("button");
      btn.id = MOBILE_TOGGLE_ID;
      btn.className = "mobile-menu-toggle";
      btn.innerHTML = "☰";

      sidebarContainer.parentNode.insertBefore(btn, sidebarContainer);

      btn.addEventListener("click", event => {
        event.stopPropagation();
        document.body.classList.toggle("sidebar-open");
      });
    }
  }

  function init() {
    const container = document.getElementById("sidebar-container");
    if (!container) return;

    container.innerHTML = buildSidebarHTML();
    const sidebar = document.getElementById("app-sidebar");

    // Add collapse button functionality
    const collapseBtn = sidebar.querySelector('.sidebar-collapse-btn');
    if (collapseBtn) {
      collapseBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (isDesktop()) {
          const isExpanded = document.body.classList.contains('sidebar-expanded');
          if (isExpanded) {
            document.body.classList.remove('sidebar-expanded');
            document.body.classList.add('sidebar-collapsed');
          } else {
            document.body.classList.remove('sidebar-collapsed');
            document.body.classList.add('sidebar-expanded');
          }
          // Notify charts and other responsive elements
          setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
          }, 300); // Wait for transition
        }
      });
    }

    if (!outsideClickAdded) {
      outsideClickAdded = true;
      document.addEventListener("click", e => {
        if (!isDesktop()) {
          const mobileBtn = document.getElementById(MOBILE_TOGGLE_ID);
          if (!sidebar.contains(e.target) && (!mobileBtn || !mobileBtn.contains(e.target))) {
            document.body.classList.remove("sidebar-open");
          }
        }
      });
    }

    function responsiveHandler() {
      if (isDesktop()) {
        document.body.classList.remove("sidebar-open");
        // Ensure desktop starts with expanded sidebar
        if (!document.body.classList.contains('sidebar-expanded') && !document.body.classList.contains('sidebar-collapsed')) {
          document.body.classList.add('sidebar-expanded');
        }
      }
      createMobileToggleIfNeeded(container, sidebar);
    }

    window.addEventListener("resize", responsiveHandler);
    responsiveHandler();
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init)
    : init();

  window.showInstallButton = function () {
    const btn = document.getElementById('install-app-btn');
    if (btn) {
      btn.classList.remove('hidden');
      // Remove old listener if possible (though checking for existing isn't easy without a named function, 
      // but here we are redefining the logic mainly or it's a one-time init).
      // A better approach for cleaner code:
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);

      newBtn.addEventListener('click', async () => {
        if (window.installPrompt) {
          window.installPrompt.prompt();
          const { outcome } = await window.installPrompt.userChoice;
          console.log(`User response to the install prompt: ${outcome}`);
          window.installPrompt = null;
          newBtn.classList.add('hidden');
        } else {
          alert("To install DenaroTrack:\n\nChrome: Click the install icon in the address bar.\nSafari (iOS): Tap 'Share' -> 'Add to Home Screen'.");
        }
      });
    }
  };

})();
