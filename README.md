# CashFlow — Personal & Business Cash Flow Tracker

> **End-to-end Personal & Business cash flow management web app with an executive analytics dashboard, chronological running-balance ledger, multi-wallet reconciliation, Direct-Method Cash Flow Statement, and 2-way Google Sheets sync.**

🌐 **Live App (GitHub Pages):** [https://gbudidarma.github.io/cashflow/](https://gbudidarma.github.io/cashflow/)

## Overview

**CashFlow** helps individuals, freelancers, and business owners track every dollar or rupiah from initial invoice or paycheck all the way to settled bank and wallet balances. Switch seamlessly between **Personal**, **Business**, and **Combined** workspaces while keeping your data synced with **Google Sheets**.

## Key Features

- **Dual Workspaces (`Personal` | `Business` | `Combined`)**: Separate or unified tracking for personal living expenses/wealth and business operating revenue, payroll, CapEx, and tax reserves.
- **Executive Dashboard**:
  - **KPI Cards**: Total Cash on Hand (plus projected balance after pending items), Cleared Cash Inflows, Cleared Cash Outflows, and Net Cash Flow & Margin %.
  - **Interactive Charts**: Monthly Cash Inflow vs. Outflow & Net Surplus chart, Cumulative Cash Balance Trajectory area chart, and Category Outflow Breakdown donut chart.
  - **Pending Cash Pipeline & Spend Guardrails**: Track unpaid client invoices and upcoming bills, settle them with 1 click, and monitor monthly category budgets.
- **Full End-to-End Cash Tracking**:
  - **Cash Flow Ledger with Running Balance**: Searchable, filterable transaction ledger showing the exact chronological **Running Cash Balance** after every cleared transaction.
  - **Accounts & Wallets Reconciliation**: Track Bank Checking, E-Wallets, Physical Cash, High-Yield Savings, Corporate Cards, and Tax Reserves (`Opening Balance + Inflows - Outflows ± Transfers = Current Cash`).
  - **Direct-Method Cash Flow Statement**: Automated reconciliation across **Operating**, **Investing**, and **Financing** activities.
- **Google Sheets 2-Way Sync & CSV Import/Export**:
  - Built-in Google Apps Script bridge (`Code.gs`) for 1-click **Push to Sheet**, **Pull from Sheet**, or automatic sync on every new transaction, plus direct CSV import/export.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling & Icons**: Tailwind CSS, Lucide Icons
- **Charts**: Recharts
- **Storage & Sync**: LocalStorage persistence + Google Sheets 2-Way Web App Sync + CSV Import/Export

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```
