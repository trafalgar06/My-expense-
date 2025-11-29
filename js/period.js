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

  const saved = localStorage.getItem("selected_period");
  if (saved) {
    const { year, month } = parsePeriod(saved);
    yearSel.value = year;
    monthSel.value = month;
  } else {
    yearSel.value = now.getFullYear();
    monthSel.value = now.getMonth() + 1;
  }

  document.getElementById("continue-btn").onclick = () => {
    const p = toPeriod(Number(yearSel.value), Number(monthSel.value));
    localStorage.setItem("selected_period", p);
    window.location.href = "dashboard.html";
  };
});
