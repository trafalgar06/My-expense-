// ========== Utility Functions ==========
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

function toPeriod(y, m) {
  return `${y}-${String(m).padStart(2, "0")}`;
}

function parsePeriod(p) {
  const [y, mm] = p.split("-").map(Number);
  return { year: y, month: mm };
}

function periodDisplay(p) {
  const { year, month } = parsePeriod(p);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

function fmt(n) {
  return Number(n || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR"
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[m]);
}
