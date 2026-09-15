// ===== BOTTOM NAVIGATION (mobile-first app shell) =====
// Replaces the old desktop collapsible sidebar with a fixed bottom tab
// bar + floating "+" action button, injected into #nav-container the
// same way the old sidebar was injected into #sidebar-container. Kept in
// this file (and still named sidebar.js) so bootstrap.js's import list
// doesn't need to change.

function buildNavItems() {
  const current = window.location.pathname.split("/").pop() || "dashboard.html";
  const items = [
    { name: "Dashboard", href: "dashboard.html", icon: "📊" },
    { name: "Transactions", href: "expenses.html", icon: "💸" }
  ];
  const itemsRight = [
    { name: "Report", href: "report.html", icon: "📈" },
    { name: "Settings", href: "setting.html", icon: "⚙️" }
  ];

  const renderItem = i => `
    <a href="${i.href}" class="bottom-nav-item ${current === i.href ? "active" : ""}"
       onclick="window.auditLog ? window.auditLog.logNavigationEvent('${i.name}', '${i.href}') : null">
      <span class="bottom-nav-item-icon">${i.icon}</span>
      <span>${i.name}</span>
    </a>
  `;

  return {
    left: items.map(renderItem).join(""),
    right: itemsRight.map(renderItem).join("")
  };
}

function buildNavHTML() {
  const { left, right } = buildNavItems();
  return `
    <nav class="bottom-nav">
      <div class="bottom-nav-inner">
        ${left}
        <button id="fab-add-btn" class="bottom-nav-fab" aria-label="Add transaction">+</button>
        ${right}
      </div>
    </nav>
  `;
}

// The FAB always means "add an expense" — the single most common action.
// On pages where the Add Expense modal already exists in the DOM
// (Dashboard, Transactions) it's triggered directly. On pages without it
// (Report, Settings), we hand off to the Transactions page and ask it to
// open the modal once it loads, rather than duplicating the modal markup
// on every page.
function wireFab() {
  const fab = document.getElementById("fab-add-btn");
  if (!fab) return;

  fab.addEventListener("click", () => {
    const directTrigger = document.getElementById("add-expense-btn");
    if (directTrigger) {
      directTrigger.click();
    } else {
      sessionStorage.setItem("pendingAction", "add-expense");
      window.location.href = "expenses.html";
    }
  });
}

export function initializeSidebar() {
  const container = document.getElementById("nav-container");
  if (!container) return;
  container.innerHTML = buildNavHTML();
  wireFab();
}

// Auto-run
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeSidebar);
} else {
  initializeSidebar();
}

// ---------- PWA install button ----------
// Kept from the old sidebar: shows/wires whichever element(s) with class
// "install-app-btn" exist on the current page (header icon and/or the
// Settings page row) once the browser fires beforeinstallprompt.
export function showInstallButton() {
  document.querySelectorAll(".install-app-btn").forEach(btn => {
    btn.classList.remove("hidden");
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener("click", async () => {
      if (window.installPrompt) {
        window.installPrompt.prompt();
        const { outcome } = await window.installPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        window.installPrompt = null;
        newBtn.classList.add("hidden");
      } else {
        alert("To install DenaroTrack:\n\nChrome: Click the install icon in the address bar.\nSafari (iOS): Tap 'Share' -> 'Add to Home Screen'.");
      }
    });
  });
}

window.initializeSidebar = initializeSidebar;
window.showInstallButton = showInstallButton;
