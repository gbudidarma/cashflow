import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  Building2,
  CreditCard,
  PiggyBank,
  Landmark,
  Trash2,
  Briefcase,
  User,
  ShieldAlert,
} from 'lucide-react';
import {
  Account,
  AccountType,
  CategoryBudget,
  CurrencyCode,
  Transaction,
  ViewFilterMode,
  WorkspaceMode,
} from '../types';
import { computeAccountBalances, formatCurrency } from '../utils/formatters';
import { CATEGORIES } from '../data/initialData';

interface AccountsViewProps {
  workspaceFilter: ViewFilterMode;
  currency: CurrencyCode;
  accounts: Account[];
  transactions: Transaction[];
  budgets: CategoryBudget[];
  onAddAccount: (acc: Omit<Account, 'id'>) => void;
  onUpdateOpeningBalance: (id: string, openingBalance: number) => void;
  onDeleteAccount: (id: string) => void;
  onSaveBudget: (budget: Omit<CategoryBudget, 'id'>) => void;
  onDeleteBudget: (id: string) => void;
}

const COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899', '#3b82f6'];

export const AccountsView: React.FC<AccountsViewProps> = ({
  workspaceFilter,
  currency,
  accounts,
  transactions,
  budgets,
  onAddAccount,
  onUpdateOpeningBalance,
  onDeleteAccount,
  onSaveBudget,
  onDeleteBudget,
}) => {
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<AccountType>('bank');
  const [accWorkspace, setAccWorkspace] = useState<WorkspaceMode>(
    workspaceFilter === 'business' ? 'business' : 'personal'
  );
  const [accOpening, setAccOpening] = useState('0');
  const [accInstitution, setAccInstitution] = useState('');
  const [accNumber, setAccNumber] = useState('');
  const [accColor, setAccColor] = useState(COLORS[0]);

  // Budget form state
  const [budgetWorkspace, setBudgetWorkspace] = useState<WorkspaceMode>(
    workspaceFilter === 'business' ? 'business' : 'personal'
  );
  const [budgetCategory, setBudgetCategory] = useState('Housing & Rent');
  const [budgetLimit, setBudgetLimit] = useState('');

  const summaries = computeAccountBalances(accounts, transactions, workspaceFilter);

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim()) return;
    onAddAccount({
      name: accName.trim(),
      type: accType,
      workspace: accWorkspace,
      openingBalance: parseFloat(accOpening) || 0,
      institution: accInstitution.trim() || 'Primary Institution',
      accountNumber: accNumber.trim() || 'Account',
      color: accColor,
    });
    setAccName('');
    setAccOpening('0');
    setAccInstitution('');
    setAccNumber('');
    setShowAddAccount(false);
  };

  const handleCreateBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(budgetLimit);
    if (isNaN(limit) || limit <= 0) return;
    onSaveBudget({
      category: budgetCategory,
      workspace: budgetWorkspace,
      monthlyLimit: limit,
    });
    setBudgetLimit('');
  };

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'bank':
        return <Landmark className="h-5 w-5" />;
      case 'credit':
        return <CreditCard className="h-5 w-5" />;
      case 'savings':
      case 'tax_reserve':
        return <PiggyBank className="h-5 w-5" />;
      case 'ewallet':
      case 'cash':
      default:
        return <Wallet className="h-5 w-5" />;
    }
  };

  const outflowCategories = CATEGORIES.filter(
    (c) => c.type === 'outflow' && c.workspace === budgetWorkspace
  );

  return (
    <div className="space-y-8">
      {/* Header & Add Account Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">
            Accounts, Wallets & Cash Reconciliation
          </h2>
          <p className="text-xs text-slate-400">
            Verify opening balances, total inflows, outflows, transfers, and live cash position per account
          </p>
        </div>
        <button
          onClick={() => setShowAddAccount(!showAddAccount)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition"
        >
          <Plus className="h-4 w-4" />
          Add Account / Wallet
        </button>
      </div>

      {/* Add Account Collapsible Form */}
      {showAddAccount && (
        <form
          onSubmit={handleCreateAccount}
          className="rounded-2xl border border-emerald-500/30 bg-slate-900/90 p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold text-white">
            Create New Cash Account or Wallet
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Account Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., BCA Payroll, Petty Cash..."
                value={accName}
                onChange={(e) => setAccName(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Workspace *
              </label>
              <select
                value={accWorkspace}
                onChange={(e) => setAccWorkspace(e.target.value as WorkspaceMode)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
              >
                <option value="personal">Personal</option>
                <option value="business">Business</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Account Type *
              </label>
              <select
                value={accType}
                onChange={(e) => setAccType(e.target.value as AccountType)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
              >
                <option value="bank">Bank Checking / Operating</option>
                <option value="ewallet">E-Wallet / Digital Wallet</option>
                <option value="cash">Physical Cash / Petty Cash</option>
                <option value="savings">High-Yield Savings / Vault</option>
                <option value="tax_reserve">Tax & VAT Reserve</option>
                <option value="credit">Credit / Corporate Card</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Opening Balance ({currency})
              </label>
              <input
                type="number"
                step="any"
                value={accOpening}
                onChange={(e) => setAccOpening(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Bank / Institution
              </label>
              <input
                type="text"
                placeholder="e.g., Chase, BCA, Wise, Cash"
                value={accInstitution}
                onChange={(e) => setAccInstitution(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Color Tag & Last 4 Digits
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="**** 1234"
                  value={accNumber}
                  onChange={(e) => setAccNumber(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                />
                <div className="flex items-center gap-1">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAccColor(c)}
                      className={`h-5 w-5 rounded-full border ${
                        accColor === c ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddAccount(false)}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
            >
              Save Account
            </button>
          </div>
        </form>
      )}

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {summaries.map((item) => (
          <div
            key={item.account.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow"
                    style={{ backgroundColor: item.account.color }}
                  >
                    {getAccountIcon(item.account.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">
                        {item.account.name}
                      </h3>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                          item.account.workspace === 'business'
                            ? 'bg-cyan-500/15 text-cyan-300'
                            : 'bg-violet-500/15 text-violet-300'
                        }`}
                      >
                        {item.account.workspace}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Building2 className="h-3 w-3" />
                      {item.account.institution} • {item.account.accountNumber}
                    </p>
                  </div>
                </div>

                {accounts.length > 1 && (
                  <button
                    onClick={() => onDeleteAccount(item.account.id)}
                    title="Delete account"
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/15 hover:text-rose-400 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Current Cash Balance */}
              <div className="mt-5 rounded-xl bg-slate-950/90 border border-slate-800/80 p-3.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Current Cleared Cash</span>
                  {item.projectedBalance !== item.currentBalance && (
                    <span className="text-amber-400 font-medium">
                      Proj: {formatCurrency(item.projectedBalance, currency)}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-2xl font-bold text-white">
                  {formatCurrency(item.currentBalance, currency)}
                </div>
              </div>

              {/* Complete Cash Flow Reconciliation Math */}
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Opening Balance:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="any"
                      value={item.openingBalance}
                      onChange={(e) =>
                        onUpdateOpeningBalance(
                          item.account.id,
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-24 rounded border border-slate-800 bg-slate-950 px-2 py-0.5 text-right font-mono text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>+ Cleared Cash Inflows:</span>
                  <span className="font-mono text-emerald-400">
                    +{formatCurrency(item.clearedInflows, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>- Cleared Cash Outflows:</span>
                  <span className="font-mono text-rose-400">
                    -{formatCurrency(item.clearedOutflows, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>± Net Internal Transfers:</span>
                  <span className="font-mono text-blue-400">
                    {formatCurrency(item.transfersIn - item.transfersOut, currency, true)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Category Budgets Configuration Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-emerald-400" />
              Monthly Cash Outflow Budgets & Guardrails
            </h3>
            <p className="text-xs text-slate-400">
              Set monthly spending caps for Personal or Business categories to prevent cash burn overruns
            </p>
          </div>
        </div>

        <form
          onSubmit={handleCreateBudget}
          className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end rounded-xl border border-slate-800 bg-slate-950/60 p-4"
        >
          <div>
            <label className="block text-xs text-slate-400 mb-1">Workspace</label>
            <select
              value={budgetWorkspace}
              onChange={(e) => {
                const ws = e.target.value as WorkspaceMode;
                setBudgetWorkspace(ws);
                const firstCat = CATEGORIES.find(
                  (c) => c.type === 'outflow' && c.workspace === ws
                );
                if (firstCat) setBudgetCategory(firstCat.name);
              }}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
            >
              <option value="personal">Personal</option>
              <option value="business">Business</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Category</label>
            <select
              value={budgetCategory}
              onChange={(e) => setBudgetCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
            >
              {outflowCategories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Monthly Limit ({currency})
            </label>
            <input
              type="number"
              step="any"
              min="1"
              required
              placeholder="e.g., 1500"
              value={budgetLimit}
              onChange={(e) => setBudgetLimit(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition"
          >
            Set / Update Budget
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {budgets
            .filter((b) =>
              workspaceFilter === 'all' ? true : b.workspace === workspaceFilter
            )
            .map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-3"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                    {b.workspace === 'business' ? (
                      <Briefcase className="h-3 w-3 text-cyan-400" />
                    ) : (
                      <User className="h-3 w-3 text-violet-400" />
                    )}
                    {b.category}
                  </div>
                  <div className="text-xs text-emerald-400 font-mono mt-0.5">
                    {formatCurrency(b.monthlyLimit, currency)} / mo
                  </div>
                </div>
                <button
                  onClick={() => onDeleteBudget(b.id)}
                  className="rounded p-1 text-slate-500 hover:text-rose-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
