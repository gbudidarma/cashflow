import React, { useMemo } from 'react';
import {
  FileBarChart2,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  Layers,
} from 'lucide-react';
import {
  Account,
  CashFlowActivity,
  CurrencyCode,
  Transaction,
  ViewFilterMode,
} from '../types';
import { computeAccountBalances, formatCurrency } from '../utils/formatters';

interface CashFlowStatementViewProps {
  workspaceFilter: ViewFilterMode;
  currency: CurrencyCode;
  accounts: Account[];
  transactions: Transaction[];
  selectedMonth: string;
  onSelectMonth: (m: string) => void;
}

export const CashFlowStatementView: React.FC<CashFlowStatementViewProps> = ({
  workspaceFilter,
  currency,
  accounts,
  transactions,
  selectedMonth,
  onSelectMonth,
}) => {
  const workspaceTx = useMemo(
    () =>
      transactions.filter((tx) =>
        workspaceFilter === 'all' ? true : tx.workspace === workspaceFilter
      ),
    [transactions, workspaceFilter]
  );

  const availableMonths = useMemo(() => {
    const s = new Set<string>();
    workspaceTx.forEach((tx) => {
      if (tx.date && tx.date.length >= 7) s.add(tx.date.slice(0, 7));
    });
    return Array.from(s).sort().reverse();
  }, [workspaceTx]);

  const periodTx = useMemo(() => {
    return workspaceTx.filter(
      (tx) =>
        tx.status === 'cleared' &&
        (selectedMonth === 'ALL' ? true : tx.date.startsWith(selectedMonth))
    );
  }, [workspaceTx, selectedMonth]);

  const buildActivitySection = (activityType: CashFlowActivity) => {
    const inflowsMap = new Map<string, number>();
    const outflowsMap = new Map<string, number>();

    for (const tx of periodTx) {
      if (tx.activity !== activityType || tx.type === 'transfer') continue;
      if (tx.type === 'inflow') {
        inflowsMap.set(tx.category, (inflowsMap.get(tx.category) || 0) + tx.amount);
      } else if (tx.type === 'outflow') {
        outflowsMap.set(
          tx.category,
          (outflowsMap.get(tx.category) || 0) + tx.amount
        );
      }
    }

    const inflows = Array.from(inflowsMap.entries()).map(([category, amount]) => ({
      category,
      amount,
    }));
    const outflows = Array.from(outflowsMap.entries()).map(
      ([category, amount]) => ({
        category,
        amount,
      })
    );

    const totalIn = inflows.reduce((s, i) => s + i.amount, 0);
    const totalOut = outflows.reduce((s, i) => s + i.amount, 0);

    return {
      inflows,
      outflows,
      totalIn,
      totalOut,
      net: totalIn - totalOut,
    };
  };

  const operating = useMemo(
    () => buildActivitySection('operating'),
    [periodTx]
  );
  const investing = useMemo(
    () => buildActivitySection('investing'),
    [periodTx]
  );
  const financing = useMemo(
    () => buildActivitySection('financing'),
    [periodTx]
  );

  const netCashChange = operating.net + investing.net + financing.net;

  const accountSummaries = useMemo(
    () => computeAccountBalances(accounts, transactions, workspaceFilter),
    [accounts, transactions, workspaceFilter]
  );

  const totalOpeningBalance = useMemo(
    () => accountSummaries.reduce((s, a) => s + a.openingBalance, 0),
    [accountSummaries]
  );

  const totalClosingBalance = useMemo(
    () => accountSummaries.reduce((s, a) => s + a.currentBalance, 0),
    [accountSummaries]
  );

  const renderSection = (
    title: string,
    subtitle: string,
    data: ReturnType<typeof buildActivitySection>
  ) => (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-4 sm:px-6 py-3 sm:py-4">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-white">{title}</h3>
          <p className="text-[11px] text-slate-400">{subtitle}</p>
        </div>
        <div
          className={`text-xs sm:text-sm font-bold font-mono ml-2 shrink-0 ${
            data.net >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          Net: {formatCurrency(data.net, currency, true)}
        </div>
      </div>

      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Cash Receipts / Inflows */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-400 border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1.5">
              <ArrowDownLeft className="h-3.5 w-3.5" /> Cash Receipts (Inflows)
            </span>
            <span>+{formatCurrency(data.totalIn, currency)}</span>
          </div>
          {data.inflows.length === 0 ? (
            <p className="text-xs text-slate-500 py-1.5">No cleared receipts</p>
          ) : (
            data.inflows.map((item) => (
              <div
                key={item.category}
                className="flex items-center justify-between text-xs py-1"
              >
                <span className="text-slate-300 truncate mr-2">{item.category}</span>
                <span className="font-mono font-medium text-emerald-300 shrink-0">
                  +{formatCurrency(item.amount, currency)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Cash Payments / Outflows */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-rose-400 border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1.5">
              <ArrowUpRight className="h-3.5 w-3.5" /> Cash Disbursements (Outflows)
            </span>
            <span>-{formatCurrency(data.totalOut, currency)}</span>
          </div>
          {data.outflows.length === 0 ? (
            <p className="text-xs text-slate-500 py-1.5">No cleared disbursements</p>
          ) : (
            data.outflows.map((item) => (
              <div
                key={item.category}
                className="flex items-center justify-between text-xs py-1"
              >
                <span className="text-slate-300 truncate mr-2">{item.category}</span>
                <span className="font-mono font-medium text-rose-300 shrink-0">
                  -{formatCurrency(item.amount, currency)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-3.5 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0">
            <FileBarChart2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white">
              Statement of Cash Flows
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Operating, Investing & Financing Direct Method
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => onSelectMonth('ALL')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap transition shrink-0 ${
              selectedMonth === 'ALL'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            All Time
          </button>
          {availableMonths.map((m) => (
            <button
              key={m}
              onClick={() => onSelectMonth(m)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap transition shrink-0 ${
                selectedMonth === m
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* 3 Standard Cash Flow Sections */}
      {renderSection(
        '1. Operating Activities',
        'Revenue, payroll, client retainers, rent, living & software expenses',
        operating
      )}

      {renderSection(
        '2. Investing Activities',
        'Equipment, hardware, capital purchases, and investment returns',
        investing
      )}

      {renderSection(
        '3. Financing Activities',
        'Owner draws, capital injections, reserve allocations & debt repayment',
        financing
      )}

      {/* Bottom Reconciliation Box */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 p-4 sm:p-6">
        <div className="flex items-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-3 sm:mb-4">
          <Layers className="h-4 w-4" />
          Cash Position Proof & Reconciliation
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
            <div className="text-[11px] text-slate-400">
              Opening Cash Balance
            </div>
            <div className="mt-1 text-base sm:text-xl font-bold font-mono text-white">
              {formatCurrency(totalOpeningBalance, currency)}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
            <div className="text-[11px] text-slate-400">
              Net Cash Movement ({selectedMonth === 'ALL' ? 'All Time' : selectedMonth})
            </div>
            <div
              className={`mt-1 text-base sm:text-xl font-bold font-mono ${
                netCashChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(netCashChange, currency, true)}
            </div>
          </div>

          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5">
            <div className="flex items-center justify-between text-[11px] text-emerald-200">
              <span>Closing Cash on Hand</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-1 text-base sm:text-xl font-bold font-mono text-white">
              {formatCurrency(totalClosingBalance, currency)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
