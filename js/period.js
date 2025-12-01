// ========== Period Selection ==========
document.addEventListener("DOMContentLoaded", () => {

  const yearSel = document.getElementById("year-select");
  const monthSel = document.getElementById("month-select");

  const now = new Date();

  for (let y = now.getFullYear() - 5; y <= now.getFullYear() + 3; y++) {
    yearSel.innerHTML += `<option value="${y}">${y}</option>`;
  }

  MONTH_NAMES.forEach((m, i) => {
    monthSel.innerHTML += `<option value="${i + 1}">${m}</option>`;
  });

  // Use page-specific key for period selection
  const page = 'period_selection';
  const key = `period_${page}`;
  const saved = localStorage.getItem(key);
  if (saved) {
    const { year, month } = parsePeriod(saved);
    yearSel.value = year;
    monthSel.value = month;
  } else {
    yearSel.value = now.getFullYear();
    monthSel.value = now.getMonth() + 1;
  }

  const continueBtn = document.getElementById("continue-btn");
  if (continueBtn) {
    continueBtn.addEventListener("click", () => {
      const p = toPeriod(Number(yearSel.value), Number(monthSel.value));
      localStorage.setItem(key, p);
      window.location.href = "dashboard.html";
    });
  }
});
