import { Account, CategoryBudget, Transaction, WorkspaceMode, CashFlowActivity } from '../types';

export interface CategoryOption {
  name: string;
  type: 'inflow' | 'outflow';
  workspace: WorkspaceMode;
  defaultActivity: CashFlowActivity;
}

export const CATEGORIES: CategoryOption[] = [
  // Personal Inflows
  { name: 'Salary & Payroll', type: 'inflow', workspace: 'personal', defaultActivity: 'operating' },
  { name: 'Freelance & Side Income', type: 'inflow', workspace: 'personal', defaultActivity: 'operating' },
  { name: 'Dividends & Investment Return', type: 'inflow', workspace: 'personal', defaultActivity: 'investing' },
  { name: 'Bonus & Gifts', type: 'inflow', workspace: 'personal', defaultActivity: 'operating' },
  { name: 'Refunds & Reimbursements', type: 'inflow', workspace: 'personal', defaultActivity: 'operating' },

  // Personal Outflows
  { name: 'Housing & Rent', type: 'outflow', workspace: 'personal', defaultActivity: 'operating' },
  { name: 'Groceries & Dining', type: 'outflow', workspace: 'personal', defaultActivity: 'operating' },
  { name: 'Utilities & Internet', type: 'outflow', workspace: 'personal', defaultActivity: 'operating' },
  { name: 'Transportation & Fuel', type: 'outflow', workspace: 'personal', defaultActivity: 'operating' },
  { name: 'Healthcare & Fitness', type: 'outflow', workspace: 'personal', defaultActivity: 'operating' },
  { name: 'Shopping & Lifestyle', type: 'outflow', workspace: 'personal', defaultActivity: 'operating' },
  { name: 'Subscriptions & Apps', type: 'outflow', workspace: 'personal', defaultActivity: 'operating' },
  { name: 'Investments & Stocks', type: 'outflow', workspace: 'personal', defaultActivity: 'investing' },
  { name: 'Loan / Debt Repayment', type: 'outflow', workspace: 'personal', defaultActivity: 'financing' },

  // Business Inflows
  { name: 'Client Retainers', type: 'inflow', workspace: 'business', defaultActivity: 'operating' },
  { name: 'Project & Consulting Revenue', type: 'inflow', workspace: 'business', defaultActivity: 'operating' },
  { name: 'Product & E-Commerce Sales', type: 'inflow', workspace: 'business', defaultActivity: 'operating' },
  { name: 'SaaS & Recurring Revenue', type: 'inflow', workspace: 'business', defaultActivity: 'operating' },
  { name: 'Capital Injection / Funding', type: 'inflow', workspace: 'business', defaultActivity: 'financing' },
  { name: 'Interest & Other Income', type: 'inflow', workspace: 'business', defaultActivity: 'investing' },

  // Business Outflows
  { name: 'Payroll & Contractors', type: 'outflow', workspace: 'business', defaultActivity: 'operating' },
  { name: 'Software, Cloud & SaaS', type: 'outflow', workspace: 'business', defaultActivity: 'operating' },
  { name: 'Marketing & Paid Ads', type: 'outflow', workspace: 'business', defaultActivity: 'operating' },
  { name: 'Office Rent & Coworking', type: 'outflow', workspace: 'business', defaultActivity: 'operating' },
  { name: 'COGS & Inventory', type: 'outflow', workspace: 'business', defaultActivity: 'operating' },
  { name: 'Legal, Accounting & Professional', type: 'outflow', workspace: 'business', defaultActivity: 'operating' },
  { name: 'Business Travel & Meals', type: 'outflow', workspace: 'business', defaultActivity: 'operating' },
  { name: 'Hardware & Equipment (CapEx)', type: 'outflow', workspace: 'business', defaultActivity: 'investing' },
  { name: 'Corporate Taxes & Licenses', type: 'outflow', workspace: 'business', defaultActivity: 'operating' },
  { name: 'Owner Draw / Dividends', type: 'outflow', workspace: 'business', defaultActivity: 'financing' },
];

export const INITIAL_ACCOUNTS: Account[] = [
  // Personal Accounts (Clean $0 starting balances)
  {
    id: 'acc-pers-main',
    name: 'Personal Checking',
    type: 'bank',
    workspace: 'personal',
    openingBalance: 0,
    color: '#10b981',
    institution: 'Bank Account',
    accountNumber: 'Primary',
  },
  {
    id: 'acc-pers-wallet',
    name: 'Cash & E-Wallet',
    type: 'ewallet',
    workspace: 'personal',
    openingBalance: 0,
    color: '#3b82f6',
    institution: 'Digital Wallet',
    accountNumber: 'Wallet',
  },
  // Business Accounts (Clean $0 starting balances)
  {
    id: 'acc-biz-ops',
    name: 'Business Checking',
    type: 'bank',
    workspace: 'business',
    openingBalance: 0,
    color: '#06b6d4',
    institution: 'Business Bank',
    accountNumber: 'Operating',
  },
  {
    id: 'acc-biz-tax',
    name: 'Tax & Reserve',
    type: 'tax_reserve',
    workspace: 'business',
    openingBalance: 0,
    color: '#f59e0b',
    institution: 'Reserve Vault',
    accountNumber: 'Reserve',
  },
];

// Clean empty budgets by default
export const INITIAL_BUDGETS: CategoryBudget[] = [];

// Clean empty transactions by default
export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * CashFlow Pro — Google Sheets 2-Way Sync Bridge
 * 
 * Setup Instructions:
 * 1. Open any Google Sheet (new or existing).
 * 2. Click Extensions > Apps Script.
 * 3. Paste this entire code into Code.gs and click Save.
 * 4. Click "Deploy" > "New deployment".
 * 5. Select type: "Web app".
 * 6. Set "Execute as": "Me" and "Who has access": "Anyone".
 * 7. Click "Deploy" and copy the Web App URL into CashFlow Pro!
 */

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheetsExist(ss);
  
  var transactions = readSheetRecords(ss.getSheetByName('Transactions'));
  var accounts = readSheetRecords(ss.getSheetByName('Accounts'));
  var budgets = readSheetRecords(ss.getSheetByName('Budgets'));
  
  var payload = {
    status: 'ok',
    updatedAt: new Date().toISOString(),
    transactions: transactions,
    accounts: accounts,
    budgets: budgets
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureSheetsExist(ss);
    
    var body = JSON.parse(e.postData.contents);
    
    if (body.transactions) {
      writeSheetRecords(ss.getSheetByName('Transactions'), [
        'id', 'date', 'workspace', 'type', 'status', 'activity',
        'category', 'amount', 'accountId', 'toAccountId',
        'counterparty', 'reference', 'paymentMethod', 'notes',
        'isRecurring', 'recurringFrequency', 'createdAt'
      ], body.transactions);
    }
    
    if (body.accounts) {
      writeSheetRecords(ss.getSheetByName('Accounts'), [
        'id', 'name', 'type', 'workspace', 'openingBalance',
        'institution', 'accountNumber', 'color'
      ], body.accounts);
    }
    
    if (body.budgets) {
      writeSheetRecords(ss.getSheetByName('Budgets'), [
        'id', 'category', 'workspace', 'monthlyLimit'
      ], body.budgets);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', syncedAt: new Date().toISOString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function ensureSheetsExist(ss) {
  var tabs = ['Transactions', 'Accounts', 'Budgets'];
  tabs.forEach(function(name) {
    if (!ss.getSheetByName(name)) {
      ss.insertSheet(name);
    }
  });
}

function readSheetRecords(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var val = data[i][j];
      if (headers[j] === 'amount' || headers[j] === 'openingBalance' || headers[j] === 'monthlyLimit') {
        val = Number(val) || 0;
      } else if (headers[j] === 'isRecurring') {
        val = val === true || val === 'TRUE' || val === 'true';
      }
      obj[headers[j]] = val;
    }
    if (obj.id) rows.push(obj);
  }
  return rows;
}

function writeSheetRecords(sheet, headers, records) {
  sheet.clearContents();
  var matrix = [headers];
  records.forEach(function(rec) {
    var row = headers.map(function(h) {
      return rec[h] !== undefined && rec[h] !== null ? rec[h] : '';
    });
    matrix.push(row);
  });
  sheet.getRange(1, 1, matrix.length, headers.length).setValues(matrix);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0f172a').setFontColor('#ffffff');
}`;
