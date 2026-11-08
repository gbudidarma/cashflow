import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  Edit3,
  Trash2,
  Plus,
  Repeat,
  Download,
} from 'lucide-react';
import {
  Account,
  CurrencyCode,
  Transaction,
  ViewFilterMode,
} from '../types';
import {
  computeLedgerWithRunningBalance,
  exportTransactionsToCSV,
  formatCurrency,
  formatDate,
} from '../utils/formatters';

interface LedgerViewProps {
  workspaceFilter: ViewFilterMode;
  currency: CurrencyCode;
  accounts: Account[];
  transactions: Transaction[];
  onOpenNewTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onMarkCleared: (id: string) => void;
}

export const LedgerView: React.FC<LedgerViewProps> = ({
  workspaceFilter,
  currency,
  accounts,
  transactions,
  onOpenNewTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onMarkCleared,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const accountMap = useMemo(
    () => new Map(accounts.map((a) => [a.id, a])),
    [accounts]
  );

  const visibleAccounts = useMemo(
    () =>
      workspaceFilter === 'all'
        ? accounts
        : accounts.filter((a) => a.workspace === workspaceFilter),
    [accounts, workspaceFilter]
  );

  // Compute full ledger with running balance
  const ledgerWithBalance = useMemo(
    () =>
      computeLedgerWithRunningBalance(
        accounts,
        transactions,
        workspaceFilter,
        accountFilter
      ),
    [accounts, transactions, workspaceFilter, accountFilter]
  );

  // Apply search, type, and status filters
  const filteredEntries = useMemo(() => {
    return ledgerWithBalance.filter((entry) => {
      if (typeFilter !== 'all' && entry.type !== typeFilter) return false;
      if (statusFilter !== 'all' && entry.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCounterparty = entry.counterparty.toLowerCase().includes(q);
        const matchCategory = entry.category.toLowerCase().includes(q);
        const matchRef = (entry.reference || '').toLowerCase().includes(q);
        const matchNotes = (entry.notes || '').toLowerCase().includes(q);
        if (!matchCounterparty && !matchCategory && !matchRef && !matchNotes) {
          return false;
        }
      }
      return true;
    });
  }, [ledgerWithBalance, typeFilter, statusFilter, searchQuery]);

  const summary = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    for (const e of filteredEntries) {
      if (e.type === 'inflow') totalIn += e.amount;
      if (e.type === 'outflow') totalOut += e.amount;
    }
    return {
      totalIn,
      totalOut,
      net: totalIn - totalOut,
    };
  }, [filteredEntries]);

  const handleDownloadCSV = () => {
    const csv = exportTransactionsToCSV(filteredEntries, accounts);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cash-ledger-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search payee, client, invoice #, category, or memo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-1">
              <Filter className="h-3.5 w-3.5" />
              Filters:
            </div>

            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">All Accounts / Wallets</option>
              {visibleAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="inflow">Cash In (Inflow)</option>
              <option value="outflow">Cash Out (Outflow)</option>
              <option value="transfer">Transfers</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="cleared">Cleared Only</option>
              <option value="pending">Pending / Scheduled</option>
            </select>

            <button
              onClick={handleDownloadCSV}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
            >
              <Download className="h-3.5 w-3.5" />
              CSV
            </button>

            <button
              onClick={onOpenNewTransaction}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              New Entry
            </button>
          </div>
        </div>

        {/* Filtered Totals Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 pt-3 text-xs">
          <div className="text-slate-400">
            Showing <span className="font-semibold text-white">{filteredEntries.length}</span>{' '}
            cash flow entries with live running balance
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <div>
              <span className="text-slate-400">Filtered Inflows: </span>
              <span className="font-semibold text-emerald-400">
                +{formatCurrency(summary.totalIn, currency)}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Filtered Outflows: </span>
              <span className="font-semibold text-rose-400">
                -{formatCurrency(summary.totalOut, currency)}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Net Filtered Flow: </span>
              <span
                className={`font-bold ${
                  summary.net >= 0 ? 'text-emerald-300' : 'text-rose-300'
                }`}
              >
                {formatCurrency(summary.net, currency, true)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Counterparty & Reference</th>
                <th className="py-3.5 px-4">Category & Activity</th>
                <th className="py-3.5 px-4">Account / Wallet</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Cash Flow Amount</th>
                <th className="py-3.5 px-4 text-right">Running Cash Balance</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No matching transactions found. Click "New Entry" to record a cash flow item.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((tx) => {
                  const fromAcc = accountMap.get(tx.accountId);
                  const toAcc = tx.toAccountId
                    ? accountMap.get(tx.toAccountId)
                    : undefined;

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-800/40 transition group"
                    >
                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-200">
                          {formatDate(tx.date)}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase">
                          {tx.workspace}
                        </div>
                      </td>

                      {/* Counterparty & Ref */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-lg shrink-0 ${
                              tx.type === 'inflow'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : tx.type === 'outflow'
                                ? 'bg-rose-500/15 text-rose-400'
                                : 'bg-blue-500/15 text-blue-400'
                            }`}
                          >
                            {tx.type === 'inflow' ? (
                              <ArrowDownLeft className="h-3.5 w-3.5" />
                            ) : tx.type === 'outflow' ? (
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowLeftRight className="h-3.5 w-3.5" />
                            )}
                          </span>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              {tx.counterparty}
                              {tx.isRecurring && (
                                <span
                                  title={`Recurring (${tx.recurringFrequency})`}
                                  className="inline-flex items-center text-emerald-400"
                                >
                                  <Repeat className="h-3 w-3" />
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2">
                              {tx.reference && (
                                <span className="font-mono text-slate-300">
                                  #{tx.reference}
                                </span>
                              )}
                              {tx.notes && (
                                <span className="truncate max-w-xs text-slate-500">
                                  {tx.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category & Activity */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-200">
                          {tx.category}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500">
                          {tx.activity} • {tx.paymentMethod || 'Transfer'}
                        </div>
                      </td>

                      {/* Account */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {tx.type === 'transfer' ? (
                          <div className="text-slate-200">
                            <span>{fromAcc?.name || tx.accountId}</span>
                            <span className="text-slate-500 mx-1">→</span>
                            <span>{toAcc?.name || tx.toAccountId}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{
                                backgroundColor: fromAcc?.color || '#10b981',
                              }}
                            />
                            <span className="text-slate-200">
                              {fromAcc?.name || tx.accountId}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {tx.status === 'cleared' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            Cleared
                          </span>
                        ) : (
                          <button
                            onClick={() => onMarkCleared(tx.id)}
                            title="Click to settle and include in cleared cash balance"
                            className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/40 px-2.5 py-0.5 text-[11px] font-medium text-amber-300 hover:bg-emerald-600 hover:text-white hover:border-emerald-500 transition"
                          >
                            <Clock className="h-3 w-3" />
                            Pending (Settle)
                          </button>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold">
                        {tx.type === 'inflow' ? (
                          <span className="text-emerald-400">
                            +{formatCurrency(tx.amount, currency)}
                          </span>
                        ) : tx.type === 'outflow' ? (
                          <span className="text-rose-400">
                            -{formatCurrency(tx.amount, currency)}
                          </span>
                        ) : (
                          <span className="text-blue-400">
                            ↔ {formatCurrency(tx.amount, currency)}
                          </span>
                        )}
                      </td>

                      {/* Running Balance */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {tx.status === 'cleared' ? (
                          <span className="font-mono font-semibold text-slate-200">
                            {formatCurrency(tx.runningBalance, currency)}
                          </span>
                        ) : (
                          <span className="text-[11px] italic text-slate-500">
                            Awaiting settlement
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => onEditTransaction(tx)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                            title="Edit transaction"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTransaction(tx.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition"
                            title="Delete transaction"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
