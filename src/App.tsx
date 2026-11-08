import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  ListOrdered,
  Wallet,
  FileBarChart2,
  Plus,
  FileSpreadsheet,
  User,
  Briefcase,
  Layers,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import {
  Account,
  AppState,
  CategoryBudget,
  CurrencyCode,
  GoogleSheetsConfig,
  Transaction,
  ViewFilterMode,
} from './types';
import {
  INITIAL_ACCOUNTS,
  INITIAL_BUDGETS,
  INITIAL_TRANSACTIONS,
} from './data/initialData';
import { DashboardView } from './components/DashboardView';
import { LedgerView } from './components/LedgerView';
import { AccountsView } from './components/AccountsView';
import { CashFlowStatementView } from './components/CashFlowStatementView';
import { TransactionModal } from './components/TransactionModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';

const STORAGE_KEY = 'cashflow_pro_state_v1';

export function App() {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'ledger' | 'accounts' | 'statement'
  >('dashboard');

  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load state from localStorage:', e);
    }
    return {
      workspace: 'all',
      currency: 'USD',
      accounts: INITIAL_ACCOUNTS,
      transactions: INITIAL_TRANSACTIONS,
      budgets: INITIAL_BUDGETS,
      sheetsConfig: {
        webAppUrl: '',
        autoSync: true,
        syncStatus: 'disconnected',
      },
    };
  });

  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  }, [state]);

  // Push to Google Sheets helper
  const pushToGoogleSheets = useCallback(
    async (
      txList = state.transactions,
      accList = state.accounts,
      budgetList = state.budgets
    ) => {
      const url = state.sheetsConfig.webAppUrl;
      if (!url) return;

      setState((prev) => ({
        ...prev,
        sheetsConfig: {
          ...prev.sheetsConfig,
          syncStatus: 'syncing',
          lastError: undefined,
        },
      }));

      try {
        await fetch(url, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            transactions: txList,
            accounts: accList,
            budgets: budgetList,
          }),
        });

        setState((prev) => ({
          ...prev,
          sheetsConfig: {
            ...prev.sheetsConfig,
            syncStatus: 'connected',
            lastSyncedAt: new Date().toISOString(),
            lastError: undefined,
          },
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          sheetsConfig: {
            ...prev.sheetsConfig,
            syncStatus: 'error',
            lastError:
              err instanceof Error ? err.message : 'Failed to push to Google Sheet',
          },
        }));
      }
    },
    [state.sheetsConfig.webAppUrl, state.transactions, state.accounts, state.budgets]
  );

  // Pull from Google Sheets helper
  const pullFromGoogleSheets = useCallback(async () => {
    const url = state.sheetsConfig.webAppUrl;
    if (!url) return;

    setState((prev) => ({
      ...prev,
      sheetsConfig: {
        ...prev.sheetsConfig,
        syncStatus: 'syncing',
        lastError: undefined,
      },
    }));

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.status === 'ok') {
        setState((prev) => ({
          ...prev,
          transactions:
            Array.isArray(data.transactions) && data.transactions.length > 0
              ? data.transactions
              : prev.transactions,
          accounts:
            Array.isArray(data.accounts) && data.accounts.length > 0
              ? data.accounts
              : prev.accounts,
          budgets:
            Array.isArray(data.budgets) && data.budgets.length > 0
              ? data.budgets
              : prev.budgets,
          sheetsConfig: {
            ...prev.sheetsConfig,
            syncStatus: 'connected',
            lastSyncedAt: new Date().toISOString(),
            lastError: undefined,
          },
        }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        sheetsConfig: {
          ...prev.sheetsConfig,
          syncStatus: 'error',
          lastError:
            err instanceof Error ? err.message : 'Failed to pull from Google Sheet',
        },
      }));
    }
  }, [state.sheetsConfig.webAppUrl]);

  // Handlers
  const handleSetWorkspace = (ws: ViewFilterMode) => {
    setState((prev) => ({ ...prev, workspace: ws }));
  };

  const handleSetCurrency = (currency: CurrencyCode) => {
    setState((prev) => ({ ...prev, currency }));
  };

  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    let updatedTransactions: Transaction[];
    if (existingId) {
      updatedTransactions = state.transactions.map((t) =>
        t.id === existingId ? { ...t, ...txData } : t
      );
    } else {
      const newTx: Transaction = {
        ...txData,
        id: `tx-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      updatedTransactions = [newTx, ...state.transactions];
    }

    setState((prev) => ({ ...prev, transactions: updatedTransactions }));
    setEditingTx(null);

    if (state.sheetsConfig.webAppUrl && state.sheetsConfig.autoSync) {
      pushToGoogleSheets(updatedTransactions, state.accounts, state.budgets);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = state.transactions.filter((t) => t.id !== id);
    setState((prev) => ({ ...prev, transactions: updated }));
    if (state.sheetsConfig.webAppUrl && state.sheetsConfig.autoSync) {
      pushToGoogleSheets(updated, state.accounts, state.budgets);
    }
  };

  const handleMarkCleared = (id: string) => {
    const updated = state.transactions.map((t) =>
      t.id === id ? { ...t, status: 'cleared' as const } : t
    );
    setState((prev) => ({ ...prev, transactions: updated }));
    if (state.sheetsConfig.webAppUrl && state.sheetsConfig.autoSync) {
      pushToGoogleSheets(updated, state.accounts, state.budgets);
    }
  };

  const handleAddAccount = (accData: Omit<Account, 'id'>) => {
    const newAcc: Account = {
      ...accData,
      id: `acc-${Date.now()}`,
    };
    const updatedAccounts = [...state.accounts, newAcc];
    setState((prev) => ({ ...prev, accounts: updatedAccounts }));
    if (state.sheetsConfig.webAppUrl && state.sheetsConfig.autoSync) {
      pushToGoogleSheets(state.transactions, updatedAccounts, state.budgets);
    }
  };

  const handleUpdateOpeningBalance = (id: string, openingBalance: number) => {
    const updatedAccounts = state.accounts.map((a) =>
      a.id === id ? { ...a, openingBalance } : a
    );
    setState((prev) => ({ ...prev, accounts: updatedAccounts }));
  };

  const handleDeleteAccount = (id: string) => {
    const updatedAccounts = state.accounts.filter((a) => a.id !== id);
    setState((prev) => ({ ...prev, accounts: updatedAccounts }));
  };

  const handleSaveBudget = (budgetData: Omit<CategoryBudget, 'id'>) => {
    const existing = state.budgets.find(
      (b) =>
        b.category === budgetData.category &&
        b.workspace === budgetData.workspace
    );
    let updatedBudgets: CategoryBudget[];
    if (existing) {
      updatedBudgets = state.budgets.map((b) =>
        b.id === existing.id
          ? { ...b, monthlyLimit: budgetData.monthlyLimit }
          : b
      );
    } else {
      updatedBudgets = [
        ...state.budgets,
        { ...budgetData, id: `b-${Date.now()}` },
      ];
    }
    setState((prev) => ({ ...prev, budgets: updatedBudgets }));
  };

  const handleDeleteBudget = (id: string) => {
    setState((prev) => ({
      ...prev,
      budgets: prev.budgets.filter((b) => b.id !== id),
    }));
  };

  const handleUpdateSheetsConfig = (cfg: Partial<GoogleSheetsConfig>) => {
    setState((prev) => ({
      ...prev,
      sheetsConfig: { ...prev.sheetsConfig, ...cfg },
    }));
  };

  const handleImportCSV = (rows: Transaction[]) => {
    const updated = [...rows, ...state.transactions];
    setState((prev) => ({ ...prev, transactions: updated }));
  };

  const handleResetDemo = () => {
    setState((prev) => ({
      ...prev,
      accounts: INITIAL_ACCOUNTS,
      transactions: INITIAL_TRANSACTIONS,
      budgets: INITIAL_BUDGETS,
    }));
  };

  const handleClearTransactions = () => {
    setState((prev) => ({
      ...prev,
      transactions: [],
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3.5 gap-3">
            {/* Brand & Workspace Switcher */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 text-white font-bold shadow-lg shadow-emerald-500/20">
                  CF
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-bold tracking-tight text-white">
                      CashFlow Pro
                    </h1>
                    <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                      End-to-End Cash Tracker
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Personal & Business Cash Flow • Google Sheets Sync
                  </p>
                </div>
              </div>

              {/* Dual Workspace Switcher */}
              <div className="flex items-center rounded-xl bg-slate-900 p-1 border border-slate-800">
                <button
                  onClick={() => handleSetWorkspace('all')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    state.workspace === 'all'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  Combined
                </button>
                <button
                  onClick={() => handleSetWorkspace('personal')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    state.workspace === 'personal'
                      ? 'bg-violet-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  Personal
                </button>
                <button
                  onClick={() => handleSetWorkspace('business')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    state.workspace === 'business'
                      ? 'bg-cyan-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Briefcase className="h-3.5 w-3.5" />
                  Business
                </button>
              </div>
            </div>

            {/* Right Controls: Currency, Google Sheets Sync, Record Button */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Currency Selector */}
              <select
                value={state.currency}
                onChange={(e) => handleSetCurrency(e.target.value as CurrencyCode)}
                className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 focus:border-emerald-500 focus:outline-none"
                title="Display Currency"
              >
                <option value="USD">USD ($)</option>
                <option value="IDR">IDR (Rp)</option>
                <option value="SGD">SGD (S$)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="AUD">AUD (A$)</option>
              </select>

              {/* Google Sheets Sync Button */}
              <button
                onClick={() => setIsSheetsModalOpen(true)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium transition ${
                  state.sheetsConfig.syncStatus === 'connected'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                    : 'border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                <span>Google Sheets</span>
                <span
                  className={`h-2 w-2 rounded-full ${
                    state.sheetsConfig.syncStatus === 'connected'
                      ? 'bg-emerald-400'
                      : state.sheetsConfig.syncStatus === 'syncing'
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-slate-600'
                  }`}
                />
              </button>

              {/* Primary CTA: Record Transaction */}
              <button
                onClick={() => {
                  setEditingTx(null);
                  setIsTxModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 transition"
              >
                <Plus className="h-4 w-4" />
                Record Cash Flow
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto pt-1 -mb-px">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'dashboard'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard & Analytics
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'ledger'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListOrdered className="h-4 w-4" />
              Cash Flow Ledger & Running Balance
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                {state.transactions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('accounts')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'accounts'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wallet className="h-4 w-4" />
              Accounts, Wallets & Budgets
            </button>

            <button
              onClick={() => setActiveTab('statement')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'statement'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileBarChart2 className="h-4 w-4" />
              Cash Flow Statement (Direct Method)
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            workspaceFilter={state.workspace}
            currency={state.currency}
            accounts={state.accounts}
            transactions={state.transactions}
            budgets={state.budgets}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
            onOpenNewTransaction={() => {
              setEditingTx(null);
              setIsTxModalOpen(true);
            }}
            onNavigateTab={setActiveTab}
            onMarkCleared={handleMarkCleared}
          />
        )}

        {activeTab === 'ledger' && (
          <LedgerView
            workspaceFilter={state.workspace}
            currency={state.currency}
            accounts={state.accounts}
            transactions={state.transactions}
            onOpenNewTransaction={() => {
              setEditingTx(null);
              setIsTxModalOpen(true);
            }}
            onEditTransaction={(tx) => {
              setEditingTx(tx);
              setIsTxModalOpen(true);
            }}
            onDeleteTransaction={handleDeleteTransaction}
            onMarkCleared={handleMarkCleared}
          />
        )}

        {activeTab === 'accounts' && (
          <AccountsView
            workspaceFilter={state.workspace}
            currency={state.currency}
            accounts={state.accounts}
            transactions={state.transactions}
            budgets={state.budgets}
            onAddAccount={handleAddAccount}
            onUpdateOpeningBalance={handleUpdateOpeningBalance}
            onDeleteAccount={handleDeleteAccount}
            onSaveBudget={handleSaveBudget}
            onDeleteBudget={handleDeleteBudget}
          />
        )}

        {activeTab === 'statement' && (
          <CashFlowStatementView
            workspaceFilter={state.workspace}
            currency={state.currency}
            accounts={state.accounts}
            transactions={state.transactions}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            CashFlow Pro — Dual Personal & Business Cash Management with Google Sheets Sync
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleResetDemo}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restore Sample Data
            </button>
            <span>•</span>
            <button
              onClick={handleClearTransactions}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-rose-400 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Transactions (Start Fresh)
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTx(null);
        }}
        onSave={handleSaveTransaction}
        accounts={state.accounts}
        defaultWorkspace={state.workspace === 'business' ? 'business' : 'personal'}
        currency={state.currency}
        editingTransaction={editingTx}
      />

      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        config={state.sheetsConfig}
        onUpdateConfig={handleUpdateSheetsConfig}
        onPushToSheets={() =>
          pushToGoogleSheets(state.transactions, state.accounts, state.budgets)
        }
        onPullFromSheets={pullFromGoogleSheets}
        transactions={state.transactions}
        accounts={state.accounts}
        budgets={state.budgets}
        onImportCSV={handleImportCSV}
      />
    </div>
  );
}

export default App;
