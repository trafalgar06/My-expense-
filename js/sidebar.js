// ===== DESKTOP-FIRST SIDEBAR (FINAL FIX) =====

const MOBILE_TOGGLE_ID = "mobile-menu-btn";
let outsideClickAdded = false;

function isDesktop() {
  return window.innerWidth >= 768;
}

function buildNav() {
  const current = window.location.pathname.split("/").pop();
  const items = [
    { name: "Dashboard", href: "dashboard.html", icon: "📊" },
    { name: "Transactions", href: "expenses.html", icon: "💸" },
    { name: "Reports", href: "report.html", icon: "📈" },
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
        <a href="${i.href}" class="sidebar-item ${current === i.href ? "sidebar-item-active" : ""}" onclick="window.auditLog ? window.auditLog.logNavigationEvent('${i.name}', '${i.href}') : null">
          <span class="sidebar-icon">${i.icon}</span>
          <span class="sidebar-label">${i.name}</span>
        </a>
      `;
    }
  }).join("");
}

function buildSidebarHTML() {
  const isExpanded = localStorage.getItem("sidebarExpanded") !== "false";
  const sidebarClass = isExpanded ? "sidebar-expanded" : "sidebar-collapsed";
  return `
    <aside class="sidebar ${sidebarClass}" id="app-sidebar">
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

export function initializeSidebar() {
  const container = document.getElementById("sidebar-container");
  if (!container) return;

  container.innerHTML = buildSidebarHTML();
  const sidebar = document.getElementById("app-sidebar");

  const collapseBtn = sidebar.querySelector('.sidebar-collapse-btn');
  if (collapseBtn) {
    collapseBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (isDesktop()) {
        const isExpanded = document.body.classList.contains('sidebar-expanded');
        if (isExpanded) {
          document.body.classList.remove('sidebar-expanded');
          document.body.classList.add('sidebar-collapsed');
          sidebar.classList.remove('sidebar-expanded');
          sidebar.classList.add('sidebar-collapsed');
          localStorage.setItem("sidebarExpanded", "false");
        } else {
          document.body.classList.remove('sidebar-collapsed');
          document.body.classList.add('sidebar-expanded');
          sidebar.classList.remove('sidebar-collapsed');
          sidebar.classList.add('sidebar-expanded');
          localStorage.setItem("sidebarExpanded", "true");
        }
      } else {
        document.body.classList.remove("sidebar-open");
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
      const isExpanded = localStorage.getItem("sidebarExpanded") !== "false";
      if (isExpanded) {
        document.body.classList.remove("sidebar-collapsed");
        document.body.classList.add("sidebar-expanded");
        sidebar.classList.remove("sidebar-collapsed");
        sidebar.classList.add("sidebar-expanded");
      } else {
        document.body.classList.remove("sidebar-expanded");
        document.body.classList.add("sidebar-collapsed");
        sidebar.classList.remove("sidebar-expanded");
        sidebar.classList.add("sidebar-collapsed");
      }
    } else {
      document.body.classList.remove("sidebar-expanded");
      document.body.classList.remove("sidebar-collapsed");
      sidebar.classList.remove("sidebar-expanded");
      sidebar.classList.remove("sidebar-collapsed");
    }
    createMobileToggleIfNeeded(container, sidebar);
  }

  window.addEventListener("resize", responsiveHandler);
  responsiveHandler();
}

// Auto-run if element exists
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeSidebar);
} else {
  initializeSidebar();
}

export function showInstallButton() {
  const btn = document.getElementById('install-app-btn');
  if (btn) {
    btn.classList.remove('hidden');
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
}

window.initializeSidebar = initializeSidebar;
window.showInstallButton = showInstallButton;
