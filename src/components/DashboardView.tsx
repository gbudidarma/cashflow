import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Plus,
  ArrowRight,
  Briefcase,
  User,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Account,
  CategoryBudget,
  CurrencyCode,
  Transaction,
  ViewFilterMode,
} from '../types';
import {
  computeAccountBalances,
  formatCurrency,
  formatDate,
} from '../utils/formatters';

interface DashboardViewProps {
  workspaceFilter: ViewFilterMode;
  currency: CurrencyCode;
  accounts: Account[];
  transactions: Transaction[];
  budgets: CategoryBudget[];
  selectedMonth: string; // 'ALL' or 'YYYY-MM'
  onSelectMonth: (m: string) => void;
  onOpenNewTransaction: () => void;
  onNavigateTab: (tab: 'dashboard' | 'ledger' | 'accounts' | 'statement') => void;
  onMarkCleared: (id: string) => void;
}

const PIE_COLORS = [
  '#10b981',
  '#06b6d4',
  '#8b5cf6',
  '#f59e0b',
  '#ec4899',
  '#3b82f6',
  '#f43f5e',
  '#14b8a6',
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  workspaceFilter,
  currency,
  accounts,
  transactions,
  budgets,
  selectedMonth,
  onSelectMonth,
  onOpenNewTransaction,
  onNavigateTab,
  onMarkCleared,
}) => {
  // Filter transactions by workspace
  const workspaceTx = useMemo(() => {
    return transactions.filter((tx) =>
      workspaceFilter === 'all' ? true : tx.workspace === workspaceFilter
    );
  }, [transactions, workspaceFilter]);

  // Available months for selector
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    workspaceTx.forEach((tx) => {
      if (tx.date && tx.date.length >= 7) {
        set.add(tx.date.slice(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [workspaceTx]);

  // Period filtered transactions
  const periodTx = useMemo(() => {
    if (selectedMonth === 'ALL') return workspaceTx;
    return workspaceTx.filter((tx) => tx.date.startsWith(selectedMonth));
  }, [workspaceTx, selectedMonth]);

  // Account balances
  const accountSummaries = useMemo(
    () => computeAccountBalances(accounts, transactions, workspaceFilter),
    [accounts, transactions, workspaceFilter]
  );

  const totalCurrentCash = useMemo(
    () => accountSummaries.reduce((sum, a) => sum + a.currentBalance, 0),
    [accountSummaries]
  );

  const totalProjectedCash = useMemo(
    () => accountSummaries.reduce((sum, a) => sum + a.projectedBalance, 0),
    [accountSummaries]
  );

  // Period KPI totals
  const kpis = useMemo(() => {
    let clearedInflow = 0;
    let clearedOutflow = 0;
    let pendingInflow = 0;
    let pendingOutflow = 0;
    let inflowCount = 0;
    let outflowCount = 0;

    for (const tx of periodTx) {
      if (tx.type === 'inflow') {
        if (tx.status === 'cleared') {
          clearedInflow += tx.amount;
          inflowCount++;
        } else {
          pendingInflow += tx.amount;
        }
      } else if (tx.type === 'outflow') {
        if (tx.status === 'cleared') {
          clearedOutflow += tx.amount;
          outflowCount++;
        } else {
          pendingOutflow += tx.amount;
        }
      }
    }

    const netCashFlow = clearedInflow - clearedOutflow;
    const marginPct =
      clearedInflow > 0 ? Math.round((netCashFlow / clearedInflow) * 100) : 0;

    return {
      clearedInflow,
      clearedOutflow,
      pendingInflow,
      pendingOutflow,
      inflowCount,
      outflowCount,
      netCashFlow,
      marginPct,
    };
  }, [periodTx]);

  // Monthly Trend Data (Inflow vs Outflow vs Net + Cumulative Balance)
  const monthlyTrendData = useMemo(() => {
    const monthMap = new Map<
      string,
      { month: string; inflow: number; outflow: number; net: number }
    >();

    for (const tx of workspaceTx) {
      if (tx.status !== 'cleared') continue;
      const m = tx.date.slice(0, 7);
      if (!monthMap.has(m)) {
        monthMap.set(m, { month: m, inflow: 0, outflow: 0, net: 0 });
      }
      const rec = monthMap.get(m)!;
      if (tx.type === 'inflow') rec.inflow += tx.amount;
      if (tx.type === 'outflow') rec.outflow += tx.amount;
      rec.net = rec.inflow - rec.outflow;
    }

    const sorted = Array.from(monthMap.values()).sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    const totalOpening = accountSummaries.reduce(
      (sum, a) => sum + a.openingBalance,
      0
    );
    let runningCash = totalOpening;

    return sorted.map((item) => {
      runningCash += item.net;
      const [yr, mo] = item.month.split('-');
      const label = new Date(Number(yr), Number(mo) - 1, 1).toLocaleDateString(
        'en-US',
        { month: 'short', year: '2-digit' }
      );
      return {
        ...item,
        label,
        cumulativeCash: runningCash,
      };
    });
  }, [workspaceTx, accountSummaries]);

  // Category Breakdown for Outflows
  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of periodTx) {
      if (tx.type === 'outflow' && tx.status === 'cleared') {
        map.set(tx.category, (map.get(tx.category) || 0) + tx.amount);
      }
    }
    const total = Array.from(map.values()).reduce((s, v) => s + v, 0);
    return Array.from(map.entries())
      .map(([name, value]) => ({
        name,
        value,
        pct: total > 0 ? Math.round((value / total) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [periodTx]);

  // Budget vs Actual for active month
  const budgetProgress = useMemo(() => {
    const targetMonth =
      selectedMonth === 'ALL'
        ? availableMonths[0] || new Date().toISOString().slice(0, 7)
        : selectedMonth;

    const relevantBudgets = budgets.filter((b) =>
      workspaceFilter === 'all' ? true : b.workspace === workspaceFilter
    );

    return relevantBudgets.map((b) => {
      const spent = workspaceTx
        .filter(
          (tx) =>
            tx.status === 'cleared' &&
            tx.type === 'outflow' &&
            tx.category === b.category &&
            tx.date.startsWith(targetMonth)
        )
        .reduce((s, tx) => s + tx.amount, 0);

      const pct = b.monthlyLimit > 0 ? Math.min(100, Math.round((spent / b.monthlyLimit) * 100)) : 0;
      const isOver = spent > b.monthlyLimit;
      return {
        ...b,
        spent,
        pct,
        isOver,
        targetMonth,
      };
    });
  }, [budgets, workspaceFilter, workspaceTx, selectedMonth, availableMonths]);

  // Pending Receivables & Upcoming Bills
  const pendingItems = useMemo(() => {
    return workspaceTx
      .filter((tx) => tx.status === 'pending')
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [workspaceTx]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile-Friendly Period Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3 sm:px-5 sm:py-3.5">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[11px] font-medium text-slate-400 shrink-0">Period:</span>
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
          {availableMonths.map((m) => {
            const [yr, mo] = m.split('-');
            const label = new Date(Number(yr), Number(mo) - 1, 1).toLocaleDateString(
              'en-US',
              { month: 'short', year: 'numeric' }
            );
            return (
              <button
                key={m}
                onClick={() => onSelectMonth(m)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap transition shrink-0 ${
                  selectedMonth === m
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <button
          onClick={onOpenNewTransaction}
          className="hidden sm:inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition"
        >
          <Plus className="h-4 w-4" />
          Add Cash In / Out
        </button>
      </div>

      {/* 4 Executive KPI Cards (2x2 Grid on Mobile, 4 Columns on Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Total Available Cash */}
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/60 p-3.5 sm:p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-slate-400 truncate">
              Cash on Hand
            </span>
            <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0">
              <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 text-lg sm:text-2xl font-bold text-white truncate">
            {formatCurrency(totalCurrentCash, currency)}
          </div>
          <div className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-slate-400 truncate">
            Proj: <span className="font-semibold text-emerald-300">{formatCurrency(totalProjectedCash, currency)}</span>
          </div>
        </div>

        {/* Card 2: Cash Inflows */}
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/60 p-3.5 sm:p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-slate-400 truncate">
              Cash Inflow
            </span>
            <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl bg-cyan-500/15 text-cyan-400 shrink-0">
              <ArrowDownLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 text-lg sm:text-2xl font-bold text-emerald-400 truncate">
            +{formatCurrency(kpis.clearedInflow, currency)}
          </div>
          <div className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-slate-400 truncate">
            {kpis.inflowCount} cleared {kpis.pendingInflow > 0 && `(+${formatCurrency(kpis.pendingInflow, currency)} pend)`}
          </div>
        </div>

        {/* Card 3: Cash Outflows */}
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/60 p-3.5 sm:p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-slate-400 truncate">
              Cash Outflow
            </span>
            <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl bg-rose-500/15 text-rose-400 shrink-0">
              <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 text-lg sm:text-2xl font-bold text-rose-400 truncate">
            -{formatCurrency(kpis.clearedOutflow, currency)}
          </div>
          <div className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-slate-400 truncate">
            {kpis.outflowCount} cleared {kpis.pendingOutflow > 0 && `(-${formatCurrency(kpis.pendingOutflow, currency)} due)`}
          </div>
        </div>

        {/* Card 4: Net Cash Flow */}
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/60 p-3.5 sm:p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-slate-400 truncate">
              Net Cash Flow
            </span>
            <div
              className={`flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl shrink-0 ${
                kpis.netCashFlow >= 0
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-rose-500/15 text-rose-400'
              }`}
            >
              {kpis.netCashFlow >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </div>
          </div>
          <div
            className={`mt-2 sm:mt-3 text-lg sm:text-2xl font-bold truncate ${
              kpis.netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrency(kpis.netCashFlow, currency, true)}
          </div>
          <div className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-slate-400 truncate">
            Margin: <span className="font-semibold text-slate-200">{kpis.marginPct}%</span>
          </div>
        </div>
      </div>

      {/* Fresh Start Onboarding Prompt if 0 Transactions */}
      {workspaceTx.length === 0 && (
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20 p-5 sm:p-6 text-center space-y-3">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Your CashFlow is ready!</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              All example data has been cleared. Tap the button below to record your first income, expense, or account transfer.
            </p>
          </div>
          <button
            onClick={onOpenNewTransaction}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 active:scale-95 transition"
          >
            <Plus className="h-4 w-4" />
            Record First Cash Transaction
          </button>
        </div>
      )}

      {/* Charts Row: Monthly Inflow vs Outflow & Expense Category Breakdown */}
      {workspaceTx.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Monthly Inflow / Outflow / Net Chart */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Cash Inflow vs. Outflow & Net
                </h3>
                <p className="text-[11px] text-slate-400">
                  Cleared cash movements by month
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-slate-300">
                  <span className="h-2 w-2 rounded-sm bg-emerald-500" /> In
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  <span className="h-2 w-2 rounded-sm bg-rose-500" /> Out
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" /> Net
                </span>
              </div>
            </div>

            <div className="h-56 sm:h-72 w-full -ml-3 sm:ml-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatCurrency(v, currency)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      fontSize: '11px',
                    }}
                    formatter={(value: number) => formatCurrency(value, currency)}
                  />
                  <Bar
                    dataKey="inflow"
                    name="Cash Inflow"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                  <Bar
                    dataKey="outflow"
                    name="Cash Outflow"
                    fill="#f43f5e"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                  <Line
                    type="monotone"
                    dataKey="net"
                    name="Net Cash"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#22d3ee' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expense Breakdown Donut */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Outflow Breakdown
              </h3>
              <p className="text-[11px] text-slate-400">
                Where cash is allocated
              </p>
            </div>

            {expenseByCategory.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-xs text-slate-500 py-10">
                No outflows recorded in this period.
              </div>
            ) : (
              <>
                <div className="h-44 w-full my-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseByCategory}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={68}
                        paddingAngle={3}
                      >
                        {expenseByCategory.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#1e293b',
                          borderRadius: '12px',
                          fontSize: '11px',
                        }}
                        formatter={(value: number) => formatCurrency(value, currency)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {expenseByCategory.slice(0, 5).map((item, idx) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{
                            backgroundColor: PIE_COLORS[idx % PIE_COLORS.length],
                          }}
                        />
                        <span className="text-slate-300 truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className="font-medium text-white">
                          {formatCurrency(item.value, currency)}
                        </span>
                        <span className="text-slate-500 w-7 text-right">
                          {item.pct}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Middle Row: Cumulative Trajectory & Wallets Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Cumulative Running Cash Balance Chart (if data exists) */}
        {workspaceTx.length > 0 && (
          <div className="lg:col-span-1 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-white">
                Cumulative Cash Trajectory
              </h3>
              <p className="text-[11px] text-slate-400">
                End-of-month cash progression
              </p>
            </div>
            <div className="h-48 sm:h-56 w-full -ml-3 sm:ml-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatCurrency(v, currency)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      fontSize: '11px',
                    }}
                    formatter={(value: number) => formatCurrency(value, currency)}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulativeCash"
                    name="Total Cash"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#cashGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Live Accounts & Wallets Balances */}
        <div className={`${workspaceTx.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'} rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Accounts & Wallets
              </h3>
              <p className="text-[11px] text-slate-400">
                Live cash balances tracked end-to-end
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('accounts')}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300"
            >
              Manage <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {accountSummaries.map((item) => (
              <div
                key={item.account.id}
                className="flex items-center justify-between rounded-xl border border-slate-800/90 bg-slate-950/60 p-3 hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="h-8 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.account.color }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white truncate">
                        {item.account.name}
                      </span>
                      <span
                        className={`inline-flex items-center rounded px-1.5 py-0.2 text-[9px] font-medium ${
                          item.account.workspace === 'business'
                            ? 'bg-cyan-500/15 text-cyan-300'
                            : 'bg-violet-500/15 text-violet-300'
                        }`}
                      >
                        {item.account.workspace === 'business' ? 'Biz' : 'Pers'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {item.account.institution}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-2">
                  <div className="text-sm font-bold text-white">
                    {formatCurrency(item.currentBalance, currency)}
                  </div>
                  {item.projectedBalance !== item.currentBalance && (
                    <div className="text-[9px] text-amber-400">
                      Proj: {formatCurrency(item.projectedBalance, currency)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Pending Cash Pipeline (Invoices/Bills) & Monthly Spend Guardrails */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Pending Cash Pipeline */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Pending Cash Pipeline
                </h3>
                <p className="text-[11px] text-slate-400">
                  Unpaid invoices & bills due
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('ledger')}
              className="text-xs font-medium text-emerald-400"
            >
              Ledger
            </button>
          </div>

          {pendingItems.length === 0 ? (
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-5 text-center text-xs text-slate-400">
              No pending invoices or scheduled bills right now.
            </div>
          ) : (
            <div className="space-y-2">
              {pendingItems.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${
                          tx.type === 'inflow'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-rose-500/15 text-rose-300'
                        }`}
                      >
                        {tx.type === 'inflow' ? 'Due In' : 'Due Out'}
                      </span>
                      <span className="text-xs font-semibold text-white truncate">
                        {tx.counterparty}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[10px] text-slate-400">
                      {formatDate(tx.date)} • {tx.category}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <div
                      className={`text-xs sm:text-sm font-bold ${
                        tx.type === 'inflow' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {tx.type === 'inflow' ? '+' : '-'}
                      {formatCurrency(tx.amount, currency)}
                    </div>
                    <button
                      onClick={() => onMarkCleared(tx.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/20 border border-emerald-500/40 px-2 py-1 text-[11px] font-medium text-emerald-300 active:scale-95 transition"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Settle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly Budget Guardrails */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Monthly Spend Guardrails
                </h3>
                <p className="text-[11px] text-slate-400">
                  Category limits & budgets
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('accounts')}
              className="text-xs font-medium text-emerald-400"
            >
              Set Budgets
            </button>
          </div>

          {budgetProgress.length === 0 ? (
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-5 text-center text-xs text-slate-400 space-y-1">
              <div>No budgets set yet.</div>
              <p className="text-[11px] text-slate-500">
                You can add monthly spending caps under the Wallets tab.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {budgetProgress.map((b) => (
                <div key={b.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 truncate">
                      {b.workspace === 'business' ? (
                        <Briefcase className="h-3 w-3 text-cyan-400 shrink-0" />
                      ) : (
                        <User className="h-3 w-3 text-violet-400 shrink-0" />
                      )}
                      <span className="font-medium text-slate-200 truncate">{b.category}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 shrink-0 ml-2">
                      <span
                        className={
                          b.isOver ? 'font-semibold text-rose-400' : 'text-white font-medium'
                        }
                      >
                        {formatCurrency(b.spent, currency)}
                      </span>{' '}
                      / {formatCurrency(b.monthlyLimit, currency)}
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        b.isOver
                          ? 'bg-rose-500'
                          : b.pct >= 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, b.pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
