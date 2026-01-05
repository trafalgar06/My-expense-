// ========== Goals Page Logic ==========
(function () {

  // Initialize page on load
  // DOMContentLoaded listener removed. Handled by bootstrap.js

  function bindEvents() {


    const saveGoalBtn = document.getElementById("save-goal-btn");
    if (saveGoalBtn) {
      saveGoalBtn.addEventListener("click", addGoal);
    }

    const prevMonthBtn = document.getElementById("prev-month-btn");
    if (prevMonthBtn) prevMonthBtn.addEventListener("click", () => shiftMonth(-1));

    const nextMonthBtn = document.getElementById("next-month-btn");
    if (nextMonthBtn) nextMonthBtn.addEventListener("click", () => shiftMonth(1));

    const todayBtn = document.getElementById("today-btn");
    if (todayBtn) {
      todayBtn.addEventListener("click", () => {
        const now = new Date();
        const currentPeriod = toPeriod(now.getFullYear(), now.getMonth() + 1);
        // Use page-specific key
        const page = getCurrentPage();
        const key = `period_${page}`;
        localStorage.setItem(key, currentPeriod);

        ensurePeriod(currentPeriod);
        renderGoals();
      });
    }

    // Add event listeners for edit/delete buttons (these will be added dynamically)
    document.addEventListener('click', function (e) {
      if (e.target.classList.contains('btn') && e.target.textContent.includes('Edit')) {
        const goalItem = e.target.closest('.goal-item');
        if (goalItem) {
          const goalName = goalItem.querySelector('.text-h3').textContent;
          editGoal(goalName);
        }
      } else if (e.target.classList.contains('btn') && e.target.textContent.includes('Delete')) {
        const goalItem = e.target.closest('.goal-item');
        if (goalItem) {
          const goalName = goalItem.querySelector('.text-h3').textContent;
          deleteGoal(goalName);
        }
      }
    });
  }

  function addGoal() {
    const goalNameInput = document.getElementById("new-goal-name");
    const goalAmountInput = document.getElementById("new-goal-amount");
    const goalDateInput = document.getElementById("new-goal-date");
    const goalDescriptionInput = document.getElementById("new-goal-description");

    if (!goalNameInput || !goalAmountInput) return;

    const goalName = goalNameInput.value.trim();
    const goalAmount = parseFloat(goalAmountInput.value);
    const goalDate = goalDateInput ? goalDateInput.value : null;
    const goalDescription = goalDescriptionInput ? goalDescriptionInput.value.trim() : "";

    if (!goalName) {
      alert("Please enter a goal name");
      return;
    }

    if (isNaN(goalAmount) || goalAmount <= 0) {
      alert("Please enter a valid target amount");
      return;
    }

    // Initialize goals storage if it doesn't exist
    if (!window.store.goals) {
      window.store.goals = [];
    }

    // Check if goal already exists
    if (window.store.goals.some(goal => goal.name === goalName)) {
      alert("Goal with this name already exists");
      return;
    }

    // Create new goal object
    const newGoal = {
      id: generateUUID(),
      name: goalName,
      targetAmount: goalAmount,
      targetDate: goalDate,
      description: goalDescription,
      currentAmount: 0, // Initially 0
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to store
    window.store.goals.push(newGoal);
    saveStore();

    // Clear form
    goalNameInput.value = "";
    goalAmountInput.value = "";
    if (goalDateInput) goalDateInput.value = "";
    if (goalDescriptionInput) goalDescriptionInput.value = "";

    // Log the audit event
    if (window.auditLog) {
      window.auditLog.logAddGoal(newGoal);
    }

    // Update the last action message
    const lastAction = document.getElementById("last-action");
    if (lastAction) {
      lastAction.textContent = `🎯 Goal "${goalName}" added successfully!`;
      setTimeout(() => {
        lastAction.textContent = "Set financial goals to achieve your dreams!";
      }, 3000);
    }

    // Re-render the goals list
    renderGoals();
  }

  function editGoal(goalName) {
    const existingGoal = window.store.goals.find(goal => goal.name === goalName);
    if (!existingGoal) return;

    // Create a form for editing (in a real app, you'd have a proper modal)
    const newName = prompt(`Edit goal name:`, existingGoal.name) || existingGoal.name;
    const newAmount = parseFloat(prompt(`Edit target amount:`, existingGoal.targetAmount)) || existingGoal.targetAmount;
    const newDate = prompt(`Edit target date (YYYY-MM-DD format, leave blank if none):`, existingGoal.targetDate || "");
    const newDescription = prompt(`Edit description:`, existingGoal.description || "");

    if (!newName.trim()) {
      alert("Goal name cannot be empty");
      return;
    }

    if (isNaN(newAmount) || newAmount <= 0) {
      alert("Please enter a valid target amount");
      return;
    }

    // Check if new name already exists (and it's not the same goal)
    if (window.store.goals.some(goal => goal.name === newName && goal.id !== existingGoal.id)) {
      alert("Goal with this name already exists");
      return;
    }

    // Update the goal
    existingGoal.name = newName;
    existingGoal.targetAmount = newAmount;
    existingGoal.targetDate = newDate || null;
    existingGoal.description = newDescription;
    existingGoal.updatedAt = new Date().toISOString();

    saveStore();

    // Log the audit event
    if (window.auditLog) {
      window.auditLog.logEditGoal(existingGoal, { name: newName, targetAmount: newAmount });
    }

    // Update the last action message
    const lastAction = document.getElementById("last-action");
    if (lastAction) {
      lastAction.textContent = `✏️ Goal "${existingGoal.name}" updated successfully!`;
      setTimeout(() => {
        lastAction.textContent = "Set financial goals to achieve your dreams!";
      }, 3000);
    }

    // Re-render the goals list
    renderGoals();
  }

  function deleteGoal(goalName) {
    // Immediate delete - no confirmation


    const goalIndex = window.store.goals.findIndex(goal => goal.name === goalName);
    if (goalIndex === -1) return;

    const deletedGoal = window.store.goals[goalIndex];

    // Remove from the goals array
    window.store.goals.splice(goalIndex, 1);

    saveStore();

    // Log the audit event
    if (window.auditLog) {
      window.auditLog.logDeleteGoal(deletedGoal);
    }

    // Update the last action message
    const lastAction = document.getElementById("last-action");
    if (lastAction) {
      lastAction.textContent = `🗑️ Goal "${deletedGoal.name}" deleted successfully!`;
      setTimeout(() => {
        lastAction.textContent = "Set financial goals to achieve your dreams!";
      }, 3000);
    }

    // Re-render the goals list
    renderGoals();
  }

  function renderGoals() {
    // Update period display
    const periodDisplayEl = document.getElementById("current-period");
    if (periodDisplayEl) {
      const page = getCurrentPage();
      const key = `period_${page}`;
      const savedPeriod = localStorage.getItem(key);
      if (savedPeriod) {
        periodDisplayEl.textContent = periodDisplay(savedPeriod);
      }
    }

    // Render the goals list
    const goalsList = document.getElementById("goals-list");
    if (!goalsList) return;

    // Initialize goals array if it doesn't exist
    if (!window.store.goals) {
      window.store.goals = [];
    }

    goalsList.innerHTML = "";

    if (window.store.goals.length === 0) {
      goalsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎯</div>
        <h3 class="text-h3 mb-2">No goals yet</h3>
        <p class="text-body text-secondary">Add your first financial goal to get started</p>
      </div>
    `;
      return;
    }

    // Sort goals by creation date (newest first)
    const sortedGoals = [...window.store.goals].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    sortedGoals.forEach(goal => {
      // Calculate progress percentage
      const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
      const progressPercent = Math.min(progress, 100); // Cap at 100%

      const goalItem = document.createElement("div");
      goalItem.className = "goal-item p-4 border border-border-primary rounded-xl";
      goalItem.innerHTML = `
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <h3 class="text-h3 font-bold">${goal.name}</h3>
          <p class="text-body text-secondary mb-2">${goal.description || 'No description'}</p>
          
          <div class="mb-2">
            <div class="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>${fmt(goal.currentAmount)} / ${fmt(goal.targetAmount)}</span>
            </div>
            <div class="w-full bg-bg-secondary rounded-full h-2">
              <div class="bg-success h-2 rounded-full" style="width: ${progressPercent}%"></div>
            </div>
          </div>
          
          ${goal.targetDate ? `<p class="text-sm text-secondary">Target Date: ${new Date(goal.targetDate).toLocaleDateString()}</p>` : ''}
        </div>
        <div class="flex gap-2 ml-4">
          <button class="btn btn-ghost btn-sm">Edit</button>
          <button class="btn btn-danger btn-sm">Delete</button>
        </div>
      </div>
    `;

      goalsList.appendChild(goalItem);
    });

    // Update goal insights
    updateGoalInsights();
  }

  function updateGoalInsights() {
    // Force insights to zero as requested
    const totalGoals = 0;
    const totalSaved = 0;
    const totalTarget = 0;

    // Update the insights section if it exists
    const activeGoalsElement = document.querySelector('.text-2xl.font-bold.text-primary');
    const totalSavedElement = document.querySelector('.text-2xl.font-bold.text-success');
    const totalTargetElement = document.querySelector('.text-2xl.font-bold.text-accent');

    if (activeGoalsElement) activeGoalsElement.textContent = totalGoals;
    if (totalSavedElement) totalSavedElement.textContent = fmt(totalSaved);
    if (totalTargetElement) totalTargetElement.textContent = fmt(totalTarget);
  }

  function shiftMonth(delta) {
    // Use consistent period navigation utility function
    const page = getCurrentPage();
    const key = `period_${page}`;
    let currentPeriod = localStorage.getItem(key);
    if (!currentPeriod) {
      currentPeriod = toPeriod(new Date().getFullYear(), new Date().getMonth() + 1);
      localStorage.setItem(key, currentPeriod);
    }

    currentPeriod = navigatePeriod(currentPeriod, delta);

    ensurePeriod(currentPeriod);
    renderGoals();

    // Update period display
    const periodDisplayEl = document.getElementById("current-period");
    if (periodDisplayEl) {
      periodDisplayEl.textContent = periodDisplay(currentPeriod);
    }
  }

  // Initialize goals page (called from HTML)
  function initializeGoalsPage() {
    loadStore();

    // Initialize period using consistent utility function
    const currentPeriod = initPeriod();
    ensurePeriod(currentPeriod);

    bindEvents();
    renderGoals();
  }

  // Export functions that need to be accessible globally
  window.initializeGoalsPage = initializeGoalsPage;

})();