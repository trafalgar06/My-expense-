// ========== Audit Logging System ==========

// Audit log operations
function logAuditEvent(operation, details = {}) {
  try {
    // Create audit entry
    const auditEntry = {
      timestamp: new Date().toISOString(),
      operation: operation,
      details: details,
      page: window.location.pathname.split('/').pop(),
      userAgent: navigator.userAgent,
      sessionId: getSessionId()
    };

    // Save to localStorage for persistence
    const auditLog = getAuditLog();
    auditLog.push(auditEntry);

    // Keep only last 1000 entries to prevent storage overflow
    if (auditLog.length > 1000) {
      auditLog.splice(0, auditLog.length - 1000);
    }

    localStorage.setItem('audit_log', JSON.stringify(auditLog));

    // Also update the Audit file (for display purposes)
    updateAuditFile(auditEntry);
  } catch (error) {
    console.warn('Audit logging failed:', error);
  }
}

function getAuditLog() {
  try {
    const stored = localStorage.getItem('audit_log');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Error reading audit log:', error);
    return [];
  }
}

function getSessionId() {
  let sessionId = localStorage.getItem('audit_session_id');
  if (!sessionId) {
    sessionId = generateUUID();
    localStorage.setItem('audit_session_id', sessionId);
  }
  return sessionId;
}

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function updateAuditFile(newEntry) {
  // In a real implementation, this would update a server-side audit file
  // For this client-side implementation, we'll maintain the log in localStorage
  // and provide a way to export it

  const auditLog = getAuditLog();
  const auditContent = generateAuditReport(auditLog);

  // Store the formatted audit report
  localStorage.setItem('formatted_audit_report', auditContent);
}

function generateAuditReport(auditLog) {
  let report = `# DenaroTrack Application Audit Log\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `## Recent Activity\n\n`;

  // Sort by timestamp (newest first)
  const sortedLog = [...auditLog].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  report += '| Timestamp | Operation | Page | Details |\n';
  report += '|-----------|-----------|------|---------|\n';

  sortedLog.forEach(entry => {
    const timestamp = new Date(entry.timestamp).toLocaleString();
    const details = JSON.stringify(entry.details).replace(/\|/g, '\\|').substring(0, 50) + '...';
    report += `| ${timestamp} | ${entry.operation} | ${entry.page} | ${details} |\n`;
  });

  return report;
}

function exportAuditLog() {
  const auditLog = getAuditLog();
  const auditContent = generateAuditReport(auditLog);

  // Create download link
  const blob = new Blob([auditContent], { type: 'text/markdown;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `DenaroTrack_Audit_${new Date().toISOString().split('T')[0]}.md`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Initialize audit system on page load
document.addEventListener('DOMContentLoaded', () => {
  // Log page load event
  logAuditEvent('PAGE_LOAD', {
    page: window.location.pathname,
    referrer: document.referrer
  });
});

// Log common operations
function logAddExpense(expenseData) {
  logAuditEvent('ADD_EXPENSE', {
    id: expenseData.id,
    name: expenseData.name,
    amount: expenseData.amount,
    category: expenseData.category,
    date: expenseData.date
  });
}

function logEditExpense(oldData, newData) {
  logAuditEvent('EDIT_EXPENSE', {
    id: oldData.id,
    old: { name: oldData.name, amount: oldData.amount, category: oldData.category },
    new: { name: newData.name, amount: newData.amount, category: newData.category }
  });
}

function logDeleteExpense(expenseData) {
  logAuditEvent('DELETE_EXPENSE', {
    id: expenseData.id,
    name: expenseData.name,
    amount: expenseData.amount
  });
}

function logAddIncome(incomeData) {
  logAuditEvent('ADD_INCOME', {
    id: incomeData.id,
    source: incomeData.source,
    amount: incomeData.amount,
    category: incomeData.category,
    date: incomeData.date
  });
}

function logEditIncome(oldData, newData) {
  logAuditEvent('EDIT_INCOME', {
    id: oldData.id,
    old: { source: oldData.source, amount: oldData.amount, category: oldData.category },
    new: { source: newData.source, amount: newData.amount, category: newData.category }
  });
}

function logDeleteIncome(incomeData) {
  logAuditEvent('DELETE_INCOME', {
    id: incomeData.id,
    source: incomeData.source,
    amount: incomeData.amount
  });
}

function logBudgetUpdate(oldBudget, newBudget) {
  logAuditEvent('BUDGET_UPDATE', {
    old: oldBudget,
    new: newBudget
  });
}

function logThemeChange(oldTheme, newTheme) {
  logAuditEvent('THEME_CHANGE', {
    old: oldTheme,
    new: newTheme
  });
}

function logPeriodChange(oldPeriod, newPeriod) {
  logAuditEvent('PERIOD_CHANGE', {
    old: oldPeriod,
    new: newPeriod
  });
}

// Navigation logging
function logNavigationEvent(pageName, pageUrl) {
  logAuditEvent('NAVIGATION', {
    pageName: pageName,
    pageUrl: pageUrl,
    fromPage: window.location.pathname.split('/').pop()
  });
}

// Categories logging
function logAddCategory(categoryName) {
  logAuditEvent('ADD_CATEGORY', {
    categoryName: categoryName
  });
}

function logEditCategory(oldName, newName) {
  logAuditEvent('EDIT_CATEGORY', {
    oldName: oldName,
    newName: newName
  });
}

function logDeleteCategory(categoryName) {
  logAuditEvent('DELETE_CATEGORY', {
    categoryName: categoryName
  });
}

// Goals logging
function logAddGoal(goalData) {
  logAuditEvent('ADD_GOAL', {
    id: goalData.id,
    name: goalData.name,
    targetAmount: goalData.targetAmount,
    targetDate: goalData.targetDate
  });
}

function logEditGoal(goalData, changes) {
  logAuditEvent('EDIT_GOAL', {
    id: goalData.id,
    name: goalData.name,
    changes: changes
  });
}

function logDeleteGoal(goalData) {
  logAuditEvent('DELETE_GOAL', {
    id: goalData.id,
    name: goalData.name,
    targetAmount: goalData.targetAmount
  });
}

// Export functions
window.auditLog = {
  logEvent: logAuditEvent,
  getLog: getAuditLog,
  exportLog: exportAuditLog,
  logAddExpense,
  logEditExpense,
  logDeleteExpense,
  logAddIncome,
  logEditIncome,
  logDeleteIncome,
  logBudgetUpdate,
  logThemeChange,
  logPeriodChange,
  logNavigationEvent,
  logAddCategory,
  logEditCategory,
  logDeleteCategory,
  logAddGoal,
  logEditGoal,
  logDeleteGoal
};