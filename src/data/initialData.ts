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
  { name: 'Corporate Taxes & Licenses', type: 'outflow', workspace: 'business', defaultActivity: 'Operating'.toLowerCase() as CashFlowActivity },
  { name: 'Owner Draw / Dividends', type: 'outflow', workspace: 'business', defaultActivity: 'financing' },
];

export const INITIAL_ACCOUNTS: Account[] = [
  // Personal Accounts
  {
    id: 'acc-pers-main',
    name: 'Personal Checking',
    type: 'bank',
    workspace: 'personal',
    openingBalance: 4200,
    color: '#10b981',
    institution: 'Primary Bank',
    accountNumber: '**** 4821',
  },
  {
    id: 'acc-pers-wallet',
    name: 'Digital Wallet & Cash',
    type: 'ewallet',
    workspace: 'personal',
    openingBalance: 450,
    color: '#3b82f6',
    institution: 'Cash / E-Wallet',
    accountNumber: 'Wallet',
  },
  {
    id: 'acc-pers-save',
    name: 'High-Yield Emergency Fund',
    type: 'savings',
    workspace: 'personal',
    openingBalance: 12500,
    color: '#8b5cf6',
    institution: 'Wealth Vault',
    accountNumber: '**** 9012',
  },
  // Business Accounts
  {
    id: 'acc-biz-ops',
    name: 'Business Operating Account',
    type: 'bank',
    workspace: 'business',
    openingBalance: 18500,
    color: '#06b6d4',
    institution: 'Mercury / BCA Biz',
    accountNumber: '**** 7740',
  },
  {
    id: 'acc-biz-tax',
    name: 'Tax & VAT Reserve',
    type: 'tax_reserve',
    workspace: 'business',
    openingBalance: 6200,
    color: '#f59e0b',
    institution: 'Business Reserve',
    accountNumber: '**** 7749',
  },
  {
    id: 'acc-biz-card',
    name: 'Corporate Expense Card',
    type: 'credit',
    workspace: 'business',
    openingBalance: 0,
    color: '#ec4899',
    institution: 'Corporate Visa',
    accountNumber: '**** 3318',
  },
];

export const INITIAL_BUDGETS: CategoryBudget[] = [
  { id: 'b-1', category: 'Housing & Rent', workspace: 'personal', monthlyLimit: 1800 },
  { id: 'b-2', category: 'Groceries & Dining', workspace: 'personal', monthlyLimit: 850 },
  { id: 'b-3', category: 'Shopping & Lifestyle', workspace: 'personal', monthlyLimit: 500 },
  { id: 'b-4', category: 'Transportation & Fuel', workspace: 'personal', monthlyLimit: 350 },
  { id: 'b-5', category: 'Payroll & Contractors', workspace: 'business', monthlyLimit: 8500 },
  { id: 'b-6', category: 'Marketing & Paid Ads', workspace: 'business', monthlyLimit: 3000 },
  { id: 'b-7', category: 'Software, Cloud & SaaS', workspace: 'business', monthlyLimit: 1200 },
  { id: 'b-8', category: 'Office Rent & Coworking', workspace: 'business', monthlyLimit: 1500 },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // Prior Months History for Trend Charts
  {
    id: 'tx-101',
    date: '2026-08-05',
    type: 'inflow',
    amount: 6200,
    category: 'Salary & Payroll',
    accountId: 'acc-pers-main',
    workspace: 'personal',
    status: 'cleared',
    activity: 'operating',
    counterparty: 'TechCorp Employer',
    reference: 'PAY-2026-08',
    paymentMethod: 'Bank Transfer',
    notes: 'August monthly salary net of tax',
    isRecurring: true,
    recurringFrequency: 'monthly',
    createdAt: '2026-08-05T09:00:00Z',
  },
  {
    id: 'tx-102',
    date: '2026-08-10',
    type: 'outflow',
    amount: 1650,
    category: 'Housing & Rent',
    accountId: 'acc-pers-main',
    workspace: 'personal',
    status: 'cleared',
    activity: 'operating',
    counterparty: 'Skyline Apartments',
    reference: 'RNT-08',
    paymentMethod: 'Bank Transfer',
    notes: 'Monthly apartment rent',
    isRecurring: true,
    recurringFrequency: 'monthly',
    createdAt: '2026-08-10T10:00:00Z',
  },
  {
    id: 'tx-103',
    date: '2026-08-18',
    type: 'outflow',
    amount: 720,
    category: 'Groceries & Dining',
    accountId: 'acc-pers-wallet',
    workspace: 'personal',
    status: 'cleared',
    activity: 'operating',
    counterparty: 'Fresh Market & Cafes',
    paymentMethod: 'E-Wallet',
    createdAt: '2026-08-18T14:00:00Z',
  },
  {
    id: 'tx-104',
    date: '2026-08-12',
    type: 'inflow',
    amount: 16400,
    category: 'Client Retainers',
    accountId: 'acc-biz-ops',
    workspace: 'business',
    status: 'cleared',
    activity: 'operating',
    counterparty: 'Apex Global Partners',
    reference: 'INV-2026-081',
    paymentMethod: 'Wire Transfer',
    notes: 'August retainer & analytics package',
    isRecurring: true,
    recurringFrequency: 'monthly',
    createdAt: '2026-08-12T11:00:00Z',
  },
  {
    id: 'tx-105',
    date: '2026-08-25',
    type: 'outflow',
    amount: 7200,
    category: 'Payroll & Contractors',
    accountId: 'acc-biz-ops',
    workspace: 'business',
    status: 'cleared',
    activity: 'operating',
    counterparty: 'Engineering & Design Team',
    reference: 'PR-2026-08',
    paymentMethod: 'ACH / Batch Transfer',
    createdAt: '2026-08-25T16:00:00Z',
  },
  {
    id: 'tx-106',
    date: '2026-09-05',
    type: 'inflow',
    amount: 6200,
    category: 'Salary & Payroll',
    accountId: 'acc-pers-main',
    workspace: 'personal',
    status: 'cleared',
    activity: 'operating',
    counterparty: 'TechCorp Employer',
    reference: 'PAY-2026-09',
    paymentMethod: 'Bank Transfer',
    createdAt: '2026-09-05T09:00:00Z',
  },
  {
    id: 'tx-107',
    date: '2026-09-10',
    type: 'outflow',
    amount: 1650,
    category: 'Housing & Rent',
    accountId: 'acc-pers-main',
    workspace: 'personal',
    status: 'cleared',
    activity: 'operating',
    counterparty: 'Skyline Apartments',
    reference: 'RNT-09',
    paymentMethod: 'Bank Transfer',
    createdAt: '2026-09-10T10:00:00Z',
  },
  {
    id: 'tx-108',
    date: '2026-09-20',
    type: 'outflow',
    amount: 980,
    category: 'Groceries & Dining',
    accountId: 'acc-pers-main',
    workspace: 'personal',
    status: 'cleared',
    activity: 'operating',
    counterparty: 'Whole Foods & Dining',
    paymentMethod: 'Debit Card',
    createdAt: '2026-09-20T18:00:00Z',
  },
  {
    id: 'tx-109',
    date: '2026-09-14',
    type: 'inflow',
    amount: 19800,
    category: 'Project & Consulting Revenue',
    accountId: 'acc-biz-ops',
    workspace: 'business',
    status: 'cleared',
    activity: 'operating',
    counterparty: 'Horizon Retail Group',
    reference: 'INV-2026-094',
    paymentMethod: 'Wire Transfer',
    createdAt: '2026-09-14T15:00:00Z',
  },
  {
    id: 'tx-110',
    date: '2026-09-25',
    type: 'outflow',
    amount: 7800,
    category: 'Payroll & Contractors',
    accountId: 'acc-biz-ops',
    workspace: 'business',
    status: 'cleared',
    activity: 'operating',
    counterparty: 'Engineering & Design Team',
    reference: 'PR-2026-09',
    paymentMethod: 'ACH / Batch Transfer',
    createdAt: '2026-09-25T16:00:00Z',
  },
  {
    id: 'tx-111',
    date: '2026-09-28',
    type: 'outflow',
    amount: 2150,
    category: 'Marketing & Paid Ads',
    accountId: 'acc-biz-card',
    workspace: 'business',
    status: 'cleared',
    activity: 'operating',
    counterparty: 'Google & Meta Ads',
    reference: 'ADS-09',
    paymentMethod: 'Corporate Card',
    createdAt: '2026-09-28T12:00:00Z',
  },
  // October 2026
  {
    id: 'tx-112',
    date: '2026-10-05',
    type: 'inflow',
    amount: 6200,
    category: 'Salary & Payroll',
    accountId: 'acc-pers-main',
    workspace: 'personal',
    status: 'cleared',
    activity: 'operating',
    counterparty: 'TechCorp Employer',
    reference: 'PAY-2026-10',
    paymentMethod: 'Bank Transfer',
    createdAt: '2026-10-05T09:00:00Z',
  },
  {
    id: 'tx-113',
    date: '2026-10-10',
    type: 'outflow',
    amount: 1650,
    category: 'Housing & Rent',
    accountId: 'acc-pers-main',
    workspace: 'personal',
    status: 'cleared',
    activity: 'operating',
    counterparty: 'Skyline Apartments',
    reference: 'RNT-10',
    paymentMethod: 'Bank Transfer',
    createdAt: '2026-10-10T10:00:00Z',
  },
  {
    id: 'tx-114',
    date: '2026-10-15',
    type: 'transfer',
    amount: 1500,
    category: 'Internal Transfer',
    accountId: 'acc-pers-main',
    toAccountId: 'acc-pers-save',
    workspace: 'personal',
    status: 'cleared',
    activity: 'financing',
    counterparty: 'Self Transfer to Emergency Savings',
    reference: 'TRF-1015',
    paymentMethod: 'Internal Transfer',
    notes: 'Monthly automated savings allocation',
    createdAt: '2026-10-15T08:00:00Z',
  },
  {
    id: 'tx-115',
    date: '2026-10-12',
    type: 'inflow',
    amount: 22500,
    category: 'Client Retainers',
    accountId: 'acc-biz-ops',
    workspace: 'business',
    status: 'cleared',
    activity: 'operating',
    counterparty: 'Apex Global & Lumina Corp',
    reference: 'INV-2026-102',
    paymentMethod: 'Wire Transfer',
    createdAt: '2026-10-12T10:30:00Z',
  },
  {
    id: 'tx-116',
    date: '2026-10-22',
    type: 'outflow',
    amount: 2400,
    category: 'Hardware & Equipment (CapEx)',
    accountId: 'acc-biz-ops',
    workspace: 'business',
    status: 'cleared',
    activity: 'investing',
    counterparty: 'Apple Business Store',
    reference: 'PO-8821',
    paymentMethod: 'Debit Card',
    notes: 'MacBook Pro workstation upgrade',
    createdAt: '2026-10-22T14:15:00Z',
  },
  {
    id: 'tx-117',
    date: '2026-10-25',
    type: 'outflow',
    amount: 8100,
    category: 'Payroll & Contractors',
    accountId: 'acc-biz-ops',
    workspace: 'business',
    status: 'cleared',
    activity: 'operating',
    counterparty: 'Engineering & Design Team',
    reference: 'PR-2026-10',
    paymentMethod: 'ACH / Batch Transfer',
    createdAt: '2026-10-25T16:00:00Z',
  },
  // November 2026 (Current Month)
  {
    id: 'tx-118',
    date: '2026-11-01',
    type: 'outflow',
    amount: 1400,
    category: 'Office Rent & Coworking',
    accountId: 'acc-biz-ops',
    workspace: 'business',
    status: 'cleared',
    activity: 'operating',
    counterparty: 'WeWork Studio Hub',
    reference: 'WW-2026-11',
    paymentMethod: 'Bank Transfer',
    isRecurring: true,
    recurringFrequency: 'monthly',
    createdAt: '2026-11-01T09:00:00Z',
  },
  {
    id: 'tx-119',
    date: '2026-11-02',
    type: 'inflow',
    amount: 14800,
    category: 'Client Retainers',
    accountId: 'acc-biz-ops',
    workspace: 'business',
    status: 'cleared',
    activity: 'operating',
    counterparty: 'Apex Global Partners',
    reference: 'INV-2026-110',
    paymentMethod: 'Wire Transfer',
    notes: 'November monthly retainer settled',
    isRecurring: true,
    recurringFrequency: 'monthly',
    createdAt: '2026-11-02T11:20:00Z',
  },
  {
    id: 'tx-120',
    date: '2026-11-03',
    type: 'outflow',
    amount: 940,
    category: 'Software, Cloud & SaaS',
    accountId: 'acc-biz-card',
    workspace: 'business',
    status: 'cleared',
    activity: 'operating',
    counterparty: 'AWS, Vercel, Google Workspace, Figma',
    reference: 'SAAS-11',
    paymentMethod: 'Corporate Card',
    isRecurring: true,
    recurringFrequency: 'monthly',
    createdAt: '2026-11-03T08:45:00Z',
  },
  {
    id: 'tx-121',
    date: '2026-11-04',
    type: 'transfer',
    amount: 2200,
    category: 'Internal Transfer',
    accountId: 'acc-biz-ops',
    toAccountId: 'acc-biz-tax',
    workspace: 'business',
    status: 'cleared',
    activity: 'financing',
    counterparty: 'Tax Reserve Allocation (15%)',
    reference: 'TAX-ALLOC-11',
    paymentMethod: 'Internal Transfer',
    notes: 'Set aside 15% of revenue into Tax Reserve',
    createdAt: '2026-11-04T10:00:00Z',
  },
  {
    id: 'tx-122',
    date: '2026-11-05',
    type: 'inflow',
    amount: 6200,
    category: 'Salary & Payroll',
    accountId: 'acc-pers-main',
    workspace: 'personal',
    status: 'cleared',
    activity: 'operating',
    counterparty: 'TechCorp Employer',
    reference: 'PAY-2026-11',
    paymentMethod: 'Bank Transfer',
    isRecurring: true,
    recurringFrequency: 'monthly',
    createdAt: '2026-11-05T09:00:00Z',
  },
  {
    id: 'tx-123',
    date: '2026-11-06',
    type: 'inflow',
    amount: 1450,
    category: 'Freelance & Side Income',
    accountId: 'acc-pers-main',
    workspace: 'personal',
    status: 'cleared',
    activity: 'operating',
    counterparty: 'UI Audit Advisory',
    reference: 'FRL-19',
    paymentMethod: 'Bank Transfer',
    createdAt: '2026-11-06T16:10:00Z',
  },
  {
    id: 'tx-124',
    date: '2026-11-06',
    type: 'outflow',
    amount: 1650,
    category: 'Housing & Rent',
    accountId: 'acc-pers-main',
    workspace: 'personal',
    status: 'cleared',
    activity: 'operating',
    counterparty: 'Skyline Apartments',
    reference: 'RNT-11',
    paymentMethod: 'Bank Transfer',
    isRecurring: true,
    recurringFrequency: 'monthly',
    createdAt: '2026-11-06T17:00:00Z',
  },
  {
    id: 'tx-125',
    date: '2026-11-07',
    type: 'outflow',
    amount: 340,
    category: 'Groceries & Dining',
    accountId: 'acc-pers-wallet',
    workspace: 'personal',
    status: 'cleared',
    activity: 'operating',
    counterparty: 'Supermarket & Coffee',
    paymentMethod: 'E-Wallet',
    createdAt: '2026-11-07T13:30:00Z',
  },
  {
    id: 'tx-126',
    date: '2026-11-07',
    type: 'outflow',
    amount: 185,
    category: 'Utilities & Internet',
    accountId: 'acc-pers-main',
    workspace: 'personal',
    status: 'cleared',
    activity: 'operating',
    counterparty: 'FiberNet & City Power',
    reference: 'UTIL-11',
    paymentMethod: 'Auto-Debit',
    isRecurring: true,
    recurringFrequency: 'monthly',
    createdAt: '2026-11-07T15:00:00Z',
  },
  {
    id: 'tx-127',
    date: '2026-11-08',
    type: 'outflow',
    amount: 1750,
    category: 'Marketing & Paid Ads',
    accountId: 'acc-biz-card',
    workspace: 'business',
    status: 'cleared',
    activity: 'operating',
    counterparty: 'Google Search & LinkedIn Ads',
    reference: 'CAMPAIGN-Q4',
    paymentMethod: 'Corporate Card',
    notes: 'Q4 lead generation campaign',
    createdAt: '2026-11-08T10:15:00Z',
  },
  // Pending Receivables & Upcoming Bills (Tracked in Cash Pipeline)
  {
    id: 'tx-128',
    date: '2026-11-15',
    type: 'inflow',
    amount: 9500,
    category: 'Project & Consulting Revenue',
    accountId: 'acc-biz-ops',
    workspace: 'business',
    status: 'pending',
    activity: 'operating',
    counterparty: 'Vanguard Logistics Ltd',
    reference: 'INV-2026-118 (Net 15)',
    paymentMethod: 'Wire Transfer',
    notes: 'Phase 2 milestone invoice sent — awaiting client wire',
    createdAt: '2026-11-08T11:00:00Z',
  },
  {
    id: 'tx-129',
    date: '2026-11-25',
    type: 'outflow',
    amount: 8100,
    category: 'Payroll & Contractors',
    accountId: 'acc-biz-ops',
    workspace: 'business',
    status: 'pending',
    activity: 'operating',
    counterparty: 'Engineering & Design Team',
    reference: 'PR-2026-11',
    paymentMethod: 'ACH / Batch Transfer',
    notes: 'Scheduled November payroll run',
    isRecurring: true,
    recurringFrequency: 'monthly',
    createdAt: '2026-11-08T11:05:00Z',
  },
  {
    id: 'tx-130',
    date: '2026-11-18',
    type: 'outflow',
    amount: 220,
    category: 'Subscriptions & Apps',
    accountId: 'acc-pers-main',
    workspace: 'personal',
    status: 'pending',
    activity: 'operating',
    counterparty: 'Gym, Cloud Storage & Streaming',
    reference: 'SUB-11',
    paymentMethod: 'Debit Card',
    notes: 'Upcoming monthly personal subscriptions',
    isRecurring: true,
    recurringFrequency: 'monthly',
    createdAt: '2026-11-08T11:10:00Z',
  },
];

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
