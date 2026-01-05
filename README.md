# 💰 DenaroTrack - Personal Finance Tracker

A modern, feature-rich expense tracking web application built with vanilla JavaScript, HTML, and CSS. Track your income, expenses, set financial goals, and visualize your spending patterns with beautiful charts and analytics.

## ✨ Features

### 📊 Dashboard
- **Real-time Overview**: View your budget, spending, and remaining balance at a glance
- **Interactive Charts**: Visualize spending by category and track trends over time
- **Recent Transactions**: Quick access to your latest income and expense entries
- **Period Navigation**: Easily switch between different months
- **Quick Actions**: Add income or expenses directly from the dashboard

### 💸 Expense Management
- **Track Expenses**: Record all your expenses with categories, amounts, and dates
- **Smart Filtering**: Filter expenses by category, amount range, or search by name
- **Category Organization**: Organize expenses into customizable categories
- **Monthly View**: See all expenses for the current period
- **Bulk Actions**: Clear all expenses for a month if needed

### 💰 Income Tracking
- **Multiple Income Sources**: Track salary, freelance work, investments, gifts, and more
- **Income Categories**: Organize income by source type
- **Filtering & Search**: Find specific income entries quickly
- **Monthly Summaries**: View total income for each period

### 🎯 Financial Goals
- **Goal Setting**: Set savings goals with target amounts and dates
- **Progress Tracking**: Visual progress bars show how close you are to your goals
- **Goal Management**: Edit or delete goals as your priorities change
- **Goal Insights**: See total saved vs. total target across all goals

### 🏷️ Category Management
- **Custom Categories**: Create and manage your own expense categories
- **Default Categories**: Pre-loaded with common categories (Food, Transport, Shopping, etc.)
- **Category Icons**: Each category has an associated emoji for easy recognition
- **Edit & Delete**: Modify or remove categories as needed

### 📈 Reports & Analytics
- **Financial Summary**: View income, expenses, and savings for any period
- **Spending Analysis**: Identify your biggest expenses and top spending categories
- **Visual Charts**: Interactive charts powered by Chart.js
- **Transaction Count**: Track the number of transactions per period

### ⚙️ Settings
- **Currency Selection**: Choose from multiple currencies (INR, USD, EUR, GBP, JPY)
- **Dark Mode**: Toggle between light and dark themes
- **Data Export**: Export your financial data as CSV
- **Audit Log**: Track all changes made to your financial data

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3.x (for running the local server) or any other HTTP server

### Installation

1. **Clone or download the repository**
   ```bash
   git clone <repository-url>
   cd "My expense"
   ```

2. **Start a local server**
   
   Using Python:
   ```bash
   python -m http.server 8000
   ```
   
   Or using Node.js:
   ```bash
   npx http-server -p 8000
   ```

3. **Open in browser**
   Navigate to `http://localhost:8000/dashboard.html`

## 📁 Project Structure

```
My expense/
├── css/
│   └── styles.css          # All application styles
├── js/
│   ├── audit.js            # Audit logging functionality
│   ├── bootstrap.js        # Page initialization router
│   ├── categories.js       # Category management
│   ├── charts.js           # Chart rendering with Chart.js
│   ├── dashboard.js        # Dashboard functionality
│   ├── expenses.js         # Expense page logic
│   ├── goals.js            # Goals management
│   ├── income.js           # Income tracking
│   ├── modal.js            # Modal window handlers
│   ├── period.js           # Period selection
│   ├── reports.js          # Reports and analytics
│   ├── settings.js         # Settings management
│   ├── sidebar.js          # Sidebar navigation
│   ├── storage.js          # LocalStorage management
│   ├── theme.js            # Theme switching
│   └── utils.js            # Utility functions
├── dashboard.html          # Main dashboard page
├── expenses.html           # Expenses management page
├── income.html             # Income tracking page
├── goals.html              # Financial goals page
├── categories.html         # Category management page
├── report.html             # Reports and analytics page
├── setting.html            # Settings page
├── period-selection.html   # Period selection page
├── index.html              # Landing page
└── README.md               # This file
```

## 🎨 Design Features

- **Modern Fintech UI**: Clean, professional design inspired by modern fintech applications
- **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark Mode Support**: Easy on the eyes with a beautiful dark theme
- **Smooth Animations**: Micro-interactions and transitions for better UX
- **Glassmorphism Effects**: Modern card designs with subtle shadows and borders
- **Color-Coded Data**: Income (green), expenses (red), and other color indicators

## 💾 Data Storage

All data is stored locally in your browser using **LocalStorage**. This means:
- ✅ Your data never leaves your device
- ✅ No server or database required
- ✅ Complete privacy and security
- ⚠️ Data is tied to your browser (clearing browser data will delete your records)
- ⚠️ No automatic backup (use CSV export for backups)

### Data Structure

The application stores:
- **Periods**: Monthly financial data (budget, income, expenses)
- **Settings**: User preferences (currency, theme)
- **Categories**: Custom expense categories
- **Audit Log**: History of all changes

## 🔧 Key Technologies

- **HTML5**: Semantic markup
- **CSS3**: Modern styling with CSS variables, flexbox, and grid
- **Vanilla JavaScript**: No frameworks, pure ES6+ JavaScript
- **Chart.js**: Beautiful, responsive charts
- **LocalStorage API**: Client-side data persistence
- **Google Fonts**: Inter font family for clean typography

## 📱 Pages Overview

### Dashboard (`dashboard.html`)
The main hub showing your financial overview, recent transactions, and quick actions.

### Expenses (`expenses.html`)
Manage all your expenses with filtering and search capabilities.

### Income (`income.html`)
Track all income sources with category organization.

### Goals (`goals.html`)
Set and track financial goals with progress visualization.

### Categories (`categories.html`)
Manage expense categories with add, edit, and delete functionality.

### Reports (`report.html`)
View detailed analytics with charts and financial summaries.

### Settings (`setting.html`)
Customize currency, theme, and manage your data.

## 🎯 Usage Tips

1. **Set Your Budget**: Start by setting a monthly budget on the dashboard
2. **Add Income**: Record your income sources for accurate tracking
3. **Track Expenses**: Add expenses as they occur for real-time insights
4. **Use Categories**: Organize expenses into categories for better analysis
5. **Set Goals**: Create savings goals to stay motivated
6. **Review Reports**: Check reports regularly to understand spending patterns
7. **Export Data**: Regularly export your data as CSV for backup

## 🔐 Privacy & Security

- All data is stored locally in your browser
- No data is sent to any server
- No tracking or analytics
- No user accounts or authentication required
- Complete control over your financial data

## 🐛 Known Limitations

- Data is browser-specific (not synced across devices)
- No automatic backup (manual CSV export required)
- Limited to single-user usage
- Browser storage limits apply (~5-10MB typically)

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome!

## 📄 License

This project is open source and available for personal use.

## 🙏 Acknowledgments

- **Chart.js** for beautiful charts
- **Google Fonts** for the Inter font family
- **Emoji** for category icons

## 📞 Support

For issues or questions, please check the code comments or create an issue in the repository.

---

**Made with ❤️ for better financial management**
