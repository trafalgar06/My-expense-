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
      { name: "Expenses", href: "expenses.html", icon: "💸" },
      { name: "Income", href: "income.html", icon: "💰" },
      { name: "Categories", href: "categories.html", icon: "🏷️" },
      { name: "Reports", href: "reports.html", icon: "📈" },
      { name: "Goals", href: "goals.html", icon: "🎯" },
      { name: "Settings", href: "settings.html", icon: "⚙️" }
    ];

    return items.map(i => `
      <a href="${i.href}" class="sidebar-item ${current === i.href ? "sidebar-item-active" : ""}">
        <span class="sidebar-icon">${i.icon}</span>
        <span class="sidebar-label">${i.name}</span>
      </a>
    `).join("");
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
          <button onclick="toggleTheme()" class="sidebar-theme-toggle">
            <span class="sidebar-label">Toggle Theme</span>
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

      document.body.insertBefore(btn, sidebarContainer);

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
      collapseBtn.addEventListener('click', function(e) {
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

})();
