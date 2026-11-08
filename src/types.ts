export type WorkspaceMode = 'personal' | 'business';
export type ViewFilterMode = 'personal' | 'business' | 'all';

export type TransactionType = 'inflow' | 'outflow' | 'transfer';
export type TransactionStatus = 'cleared' | 'pending';
export type CashFlowActivity = 'operating' | 'investing' | 'financing';

export type AccountType = 'bank' | 'cash' | 'ewallet' | 'credit' | 'savings' | 'tax_reserve';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  workspace: WorkspaceMode;
  openingBalance: number;
  color: string;
  institution?: string;
  accountNumber?: string;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  amount: number;
  category: string;
  subcategory?: string;
  accountId: string;
  toAccountId?: string; // For transfers
  workspace: WorkspaceMode;
  status: TransactionStatus;
  activity: CashFlowActivity;
  counterparty: string; // Client, Vendor, Store, Employer, etc.
  reference?: string; // Invoice # or Receipt #
  paymentMethod?: string;
  notes?: string;
  isRecurring?: boolean;
  recurringFrequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  createdAt: string;
}

export interface CategoryBudget {
  id: string;
  category: string;
  workspace: WorkspaceMode;
  monthlyLimit: number;
}

export interface GoogleSheetsConfig {
  webAppUrl: string;
  sheetUrl?: string;
  autoSync: boolean;
  lastSyncedAt?: string;
  syncStatus: 'disconnected' | 'connected' | 'syncing' | 'error';
  lastError?: string;
}

export type CurrencyCode = 'USD' | 'IDR' | 'EUR' | 'SGD' | 'GBP' | 'AUD';

export interface AppState {
  workspace: ViewFilterMode;
  currency: CurrencyCode;
  accounts: Account[];
  transactions: Transaction[];
  budgets: CategoryBudget[];
  sheetsConfig: GoogleSheetsConfig;
}
