// ========== Categories Page Logic ----------
(function () {

  // Initialize page on load
  // DOMContentLoaded listener removed. Handled by bootstrap.js

  function bindEvents() {


    const saveCategoryBtn = document.getElementById("save-category-btn");
    if (saveCategoryBtn) {
      saveCategoryBtn.addEventListener("click", addCategory);
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
        renderCategories();
      });
    }

    // Add event listeners for edit/delete buttons (these will be added dynamically)
    document.addEventListener('click', function (e) {
      if (e.target.classList.contains('btn') && e.target.textContent.includes('Edit')) {
        const categoryItem = e.target.closest('.category-item');
        if (categoryItem) {
          const categoryName = categoryItem.querySelector('.font-medium').textContent;
          editCategory(categoryName);
        }
      } else if (e.target.classList.contains('btn') && e.target.textContent.includes('Delete')) {
        const categoryItem = e.target.closest('.category-item');
        if (categoryItem) {
          const categoryName = categoryItem.querySelector('.font-medium').textContent;
          deleteCategory(categoryName);
        }
      }
    });
  }

  function addCategory() {
    const newCategoryInput = document.getElementById("new-category-name");
    if (!newCategoryInput) return;

    const categoryName = newCategoryInput.value.trim();
    if (!categoryName) {
      alert("Please enter a category name");
      return;
    }

    // Check if category already exists in store
    const currentCategories = window.store.categories || CATEGORY_LIST;
    if (currentCategories.includes(categoryName)) {
      alert("Category already exists");
      return;
    }

    // Add to the store category list
    if (!window.store.categories) {
      window.store.categories = [...CATEGORY_LIST];
    }
    window.store.categories.push(categoryName);

    // Save to localStorage
    saveStore();
    newCategoryInput.value = "";

    // Log the audit event
    if (window.auditLog) {
      window.auditLog.logAddCategory(categoryName);
    }

    // Update the last action message
    const lastAction = document.getElementById("last-action");
    if (lastAction) {
      lastAction.textContent = `✅ Category "${categoryName}" added successfully!`;
      setTimeout(() => {
        lastAction.textContent = "Manage your categories to better organize expenses!";
      }, 3000);
    }

    // Re-render the categories list
    renderCategories();
  }

  function editCategory(categoryName) {
    const newName = prompt(`Edit category name:`, categoryName);
    if (!newName || newName.trim() === categoryName) return;

    const newNameTrimmed = newName.trim();
    if (!newNameTrimmed) {
      alert("Category name cannot be empty");
      return;
    }

    // Check if new name already exists
    const currentCategories = window.store.categories || CATEGORY_LIST;
    if (currentCategories.includes(newNameTrimmed)) {
      alert("Category with this name already exists");
      return;
    }

    // Update the category in the store
    if (!window.store.categories) {
      window.store.categories = [...CATEGORY_LIST];
    }

    const index = window.store.categories.indexOf(categoryName);
    if (index !== -1) {
      window.store.categories[index] = newNameTrimmed;
      saveStore();
    }

    // Log the audit event
    if (window.auditLog) {
      window.auditLog.logEditCategory(categoryName, newNameTrimmed);
    }

    // Update the last action message
    const lastAction = document.getElementById("last-action");
    if (lastAction) {
      lastAction.textContent = `✏️ Category "${categoryName}" updated to "${newNameTrimmed}"`;
      setTimeout(() => {
        lastAction.textContent = "Manage your categories to better organize expenses!";
      }, 3000);
    }

    // Re-render the categories list
    renderCategories();
  }

  function deleteCategory(categoryName) {
    // Immediate delete - no confirmation


    // Remove from the category list
    if (!window.store.categories) {
      window.store.categories = [...CATEGORY_LIST];
    }

    const index = window.store.categories.indexOf(categoryName);
    if (index !== -1) {
      window.store.categories.splice(index, 1);
      saveStore();
    }

    // Log the audit event
    if (window.auditLog) {
      window.auditLog.logDeleteCategory(categoryName);
    }

    // Update the last action message
    const lastAction = document.getElementById("last-action");
    if (lastAction) {
      lastAction.textContent = `🗑️ Category "${categoryName}" deleted successfully!`;
      setTimeout(() => {
        lastAction.textContent = "Manage your categories to better organize expenses!";
      }, 3000);
    }

    // Re-render the categories list
    renderCategories();
  }

  function renderCategories() {
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

    // Render the categories list
    const categoriesList = document.getElementById("categories-list");
    if (!categoriesList) return;

    // Create a mapping of default category names to emojis
    const categoryEmojis = {
      "Food": "🍔",
      "Transport": "🚗",
      "Shopping": "🛍️",
      "Entertainment": "🎬",
      "Healthcare": "🏥",
      "Education": "📚",
      "Bills": "📄",
      "Other": "📦",
      "Income": "💰"
    };

    categoriesList.innerHTML = "";

    const currentCategories = window.store.categories || CATEGORY_LIST;

    if (currentCategories.length === 0) {
      categoriesList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🏷️</div>
        <h3 class="text-h3 mb-2">No categories yet</h3>
        <p class="text-body text-secondary">Add your first category to get started</p>
      </div>
    `;
      return;
    }

    // Sort categories alphabetically
    const sortedCategories = [...currentCategories].sort();

    sortedCategories.forEach(category => {
      const emoji = categoryEmojis[category] || "📦"; // Default emoji if not found

      const categoryItem = document.createElement("div");
      categoryItem.className = "category-item p-4 border border-border-primary rounded-xl flex justify-between items-center";
      categoryItem.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-xl">${emoji}</span>
        <span class="font-medium">${category}</span>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-ghost btn-sm">Edit</button>
        <button class="btn btn-danger btn-sm">Delete</button>
      </div>
    `;

      categoriesList.appendChild(categoryItem);
    });
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
    renderCategories();

    // Update period display
    const periodDisplayEl = document.getElementById("current-period");
    if (periodDisplayEl) {
      periodDisplayEl.textContent = periodDisplay(currentPeriod);
    }
  }

  // Initialize categories page (called from HTML)
  function initializeCategoriesPage() {
    loadStore();

    // Initialize period using consistent utility function
    const currentPeriod = initPeriod();
    ensurePeriod(currentPeriod);

    bindEvents();
    renderCategories();
  }

  // Export functions that need to be accessible globally
  window.initializeCategoriesPage = initializeCategoriesPage;
})();