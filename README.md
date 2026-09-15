# 💰 DenaroTrack - Personal Finance Tracker (v2)

A modern, lightweight client-side Progressive Web Application (PWA) designed to help users manage their personal finances. All data is persisted locally in the user's browser, ensuring complete privacy, offline capability, and high performance.

## ✨ Features

### 📊 Dashboard
- **Real-time Overview**: View your budget, spending, and remaining balance at a glance.
- **Interactive Inline Budget**: Click directly on the Income/Budget amount card to update your budget inline.
- **Accounts**: Track Bank/Online, Cash, and Savings balances separately, with one-click Transfer and Reconcile Cash actions.
- **Category Limits Progress**: Live progress bars displaying category-specific monthly spending limits with color thresholds (green < 60%, orange 60-80%, red > 80%).
- **Recent Transactions**: Quick access to your latest income and expense entries, tagged with their account.
- **Period Navigation**: Easily cycle between different tracking months.

### 💸 Transactions Console
- **Unified console**: Record and manage both income and expenses on a single page.
- **Account Tagging**: Every transaction is tagged Bank/Online or Cash, shown with a small icon in the list.
- **Date Filter Widget**: Click the calendar button to filter transactions by a specific day, with a clear filter pill/badge.
- **Advanced Filters**: Collapsible filter section for searching by category, min/max amount range.
- **Recurring Transactions**: Automatically generate Daily, Weekly, or Monthly recurring entries when loading periods.

### 📈 Reports & Analytics
- **Financial Summary**: Combined KPIs showing Income, Expenses, Net Savings, Biggest Expense, and Top Category.
- **Combined Trend Chart**: Replaced separate trend charts with a single combined Chart.js combo chart displaying monthly Income vs Expenses.
- **Category Distribution**: Interactive Doughnut chart showing spending by category.

### ⚙️ Settings & Customization
- **Preferences**: Choose from multiple currencies (INR, USD, EUR, GBP, JPY) and light/dark/system themes.
- **Custom Categories**: Create new categories using a floating emoji picker (powered by `emoji-picker-element`).
- **Category Limits**: Define monthly spending ceilings per category.
- **Advanced Controls**:
  - **Carry Over Balance**: Rollover previous month's net savings/debt into the opening balance.
  - **Audit Logging**: Toggle audit logs to record histories of account operations.
  - **Data Controls**: Back up and restore data using JSON backup files, export logs to CSV, or reset databases.

## 🚀 Getting Started

### Installation & Run

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd DenaroTrack
   ```

2. **Start a local static HTTP server**
   
   Using Python:
   ```bash
   python -m http.server 8000
   ```
   
   Or using Node.js:
   ```bash
   npx http-server -p 8000
   ```

3. **Open in browser**
   Navigate to **`http://localhost:8000`**. Do not open files via double-clicking in file explorer (`file://` protocol), as modern browsers block ES Modules from loading locally.

## 📁 Project Structure

```
DenaroTrack/
├── css/
│   └── styles.css          # Unified stylesheet with custom CSS tokens and themes
├── js/
│   ├── audit.js            # Operations logger tracking edits, deletes, and actions
│   ├── bootstrap.js        # Main initialization router and service worker installer
│   ├── charts.js           # Chart.js helper for trend and distribution charts
│   ├── dashboard.js        # Dashboard widget values, action buttons, & recent list
│   ├── expenses.js         # Transaction console operations, filters, and modals
│   ├── modal.js            # Modal backdrop and dialog behavior handlers
│   ├── reports.js          # Computes summary analytics and mounts report page data
│   ├── settings.js         # Settings preferences, category limits, and emoji picker
│   ├── sidebar.js          # Desktop-first collapsible navigation panel
│   ├── storage.js          # Unified LocalStorage schema wrapper and migrator
│   ├── theme.js            # Light/Dark/System theme dispatcher
│   └── utils.js            # Shared formats, currencies, date conversions, and UUIDs
├── index.html              # Entry point and redirect portal
├── dashboard.html          # Central budget overview and recent history
├── expenses.html           # Unified Transaction console
├── report.html             # Reports and combo trend charts
├── setting.html            # Preference settings and category manager
├── sw.js                   # Service worker cache list with skipWaiting()
├── manifest.json           # PWA metadata for desktop/mobile installations
└── README.md               # This documentation file
```

## 💾 Storage Schema History

- **Schema v1**: Original layout (contained separate categories, goals, savingsGoals, transactions, and settings keys).
- **Schema v2**: Removed categories, goals, savingsGoals. Added `categoryLimits`, `recurringTransactions`, and `carryOver` settings. Includes automatic database schema cleanup on migration.
- **Schema v3**: Added `accounts` (Bank/Cash/Savings running balances) and a `transfers` log. Every pre-existing transaction is auto-tagged `account: "bank"` on migration, with balances recalculated from full transaction history.

## 🔄 Recent Changes (v2 Release)
- **ES Module Architecture**: Codebase migrated to modern ES Module scripts loaded via `bootstrap.js`.
- **Page Consolidation**: Deleted redundant separate pages (`categories.html`, `goals.html`, `period-selection.html`) and consolidated their features directly into Settings and Dashboard.
- **Combined Chart**: Combined monthly income and expense trends into one chart.
- **Calendar Filter**: Added vanilla calendar popup to filter transactions by specific dates.
- **Recurring Transactions**: Automatically generates transactions on period changes.
- **Immediate PWA Swapping**: Enabled `self.skipWaiting()` to prevent caching issues.

## 🏦 Recent Changes (v3 Release)
- **Accounts**: Added Bank/Online, Cash, and Savings as separate tracked balances, replacing the single "My Finances" total.
- **Transfers**: New Transfer modal moves money between accounts without affecting budget, reports, or category limits.
- **Cash Reconciliation**: New "Reconcile Cash" action corrects your tracked cash balance to match what you're physically holding, logging the adjustment.
- **Account Tagging**: Every income/expense transaction (manual or recurring) now records which account it moved through.
- **Layout Fixes**: Consolidated sidebar CSS into a single source of truth, fixed mobile calendar popup clipping, and removed an overlapping 768px breakpoint that broke layout on tablet-width screens.

---

**Made with ❤️ for clean client-side financial management**
