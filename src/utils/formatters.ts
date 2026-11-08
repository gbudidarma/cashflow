import { Account, CurrencyCode, Transaction, ViewFilterMode } from '../types';

const CURRENCY_CONFIG: Record<CurrencyCode, { locale: string; symbol: string; decimals: number }> = {
  USD: { locale: 'en-US', symbol: '$', decimals: 0 },
  IDR: { locale: 'id-ID', symbol: 'Rp', decimals: 0 },
  EUR: { locale: 'de-DE', symbol: '€', decimals: 0 },
  SGD: { locale: 'en-SG', symbol: 'S$', decimals: 0 },
  GBP: { locale: 'en-GB', symbol: '£', decimals: 0 },
  AUD: { locale: 'en-AU', symbol: 'A$', decimals: 0 },
};

export function formatCurrency(amount: number, currency: CurrencyCode = 'USD', showSign = false): string {
  const cfg = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.USD;
  const absVal = Math.abs(amount);
  const formatted = new Intl.NumberFormat(cfg.locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: cfg.decimals,
    maximumFractionDigits: cfg.decimals,
  }).format(absVal);

  if (showSign) {
    if (amount > 0) return `+${formatted}`;
    if (amount < 0) return `-${formatted}`;
  } else if (amount < 0) {
    return `-${formatted}`;
  }
  return formatted;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export interface AccountBalanceSummary {
  account: Account;
  openingBalance: number;
  clearedInflows: number;
  clearedOutflows: number;
  transfersIn: number;
  transfersOut: number;
  currentBalance: number;
  pendingInflows: number;
  pendingOutflows: number;
  projectedBalance: number;
}

export function computeAccountBalances(
  accounts: Account[],
  transactions: Transaction[],
  workspaceFilter: ViewFilterMode
): AccountBalanceSummary[] {
  const filteredAccounts =
    workspaceFilter === 'all'
      ? accounts
      : accounts.filter((a) => a.workspace === workspaceFilter);

  return filteredAccounts.map((account) => {
    let clearedInflows = 0;
    let clearedOutflows = 0;
    let transfersIn = 0;
    let transfersOut = 0;
    let pendingInflows = 0;
    let pendingOutflows = 0;

    for (const tx of transactions) {
      if (tx.status === 'cleared') {
        if (tx.type === 'inflow' && tx.accountId === account.id) {
          clearedInflows += tx.amount;
        } else if (tx.type === 'outflow' && tx.accountId === account.id) {
          clearedOutflows += tx.amount;
        } else if (tx.type === 'transfer') {
          if (tx.accountId === account.id) {
            transfersOut += tx.amount;
          }
          if (tx.toAccountId === account.id) {
            transfersIn += tx.amount;
          }
        }
      } else if (tx.status === 'pending') {
        if (tx.type === 'inflow' && tx.accountId === account.id) {
          pendingInflows += tx.amount;
        } else if (tx.type === 'outflow' && tx.accountId === account.id) {
          pendingOutflows += tx.amount;
        }
      }
    }

    const currentBalance =
      account.openingBalance + clearedInflows - clearedOutflows + transfersIn - transfersOut;
    const projectedBalance = currentBalance + pendingInflows - pendingOutflows;

    return {
      account,
      openingBalance: account.openingBalance,
      clearedInflows,
      clearedOutflows,
      transfersIn,
      transfersOut,
      currentBalance,
      pendingInflows,
      pendingOutflows,
      projectedBalance,
    };
  });
}

export interface LedgerEntry extends Transaction {
  runningBalance: number;
  netImpact: number;
}

/**
 * Computes the chronological running cash balance across the filtered workspace
 * so the user can trace every single dollar/rupiah from opening balance to current cash.
 */
export function computeLedgerWithRunningBalance(
  accounts: Account[],
  transactions: Transaction[],
  workspaceFilter: ViewFilterMode,
  accountFilter: string = 'all'
): LedgerEntry[] {
  const relevantAccounts = accounts.filter((a) => {
    if (workspaceFilter !== 'all' && a.workspace !== workspaceFilter) return false;
    if (accountFilter !== 'all' && a.id !== accountFilter) return false;
    return true;
  });

  const relevantAccountIds = new Set(relevantAccounts.map((a) => a.id));
  const totalOpening = relevantAccounts.reduce((sum, a) => sum + a.openingBalance, 0);

  const relevantTx = transactions.filter((tx) => {
    if (workspaceFilter !== 'all' && tx.workspace !== workspaceFilter) return false;
    if (accountFilter !== 'all') {
      return tx.accountId === accountFilter || tx.toAccountId === accountFilter;
    }
    return true;
  });

  // Sort ascending by date, then createdAt to calculate running balance forward
  const sortedAsc = [...relevantTx].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.createdAt.localeCompare(b.createdAt);
  });

  let running = totalOpening;
  const ascEntries: LedgerEntry[] = sortedAsc.map((tx) => {
    let netImpact = 0;
    if (tx.type === 'inflow' && relevantAccountIds.has(tx.accountId)) {
      netImpact = tx.amount;
    } else if (tx.type === 'outflow' && relevantAccountIds.has(tx.accountId)) {
      netImpact = -tx.amount;
    } else if (tx.type === 'transfer') {
      const fromInSet = relevantAccountIds.has(tx.accountId);
      const toInSet = tx.toAccountId ? relevantAccountIds.has(tx.toAccountId) : false;
      if (fromInSet && !toInSet) netImpact = -tx.amount;
      else if (!fromInSet && toInSet) netImpact = tx.amount;
      else netImpact = 0; // Internal transfer between two accounts both in view
    }

    if (tx.status === 'cleared') {
      running += netImpact;
    }

    return {
      ...tx,
      netImpact,
      runningBalance: running,
    };
  });

  // Return newest first for ledger display
  return ascEntries.reverse();
}

export function exportTransactionsToCSV(transactions: Transaction[], accounts: Account[]): string {
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const headers = [
    'ID',
    'Date',
    'Workspace',
    'Type',
    'Status',
    'Activity',
    'Category',
    'Amount',
    'Account',
    'ToAccount',
    'Counterparty',
    'Reference',
    'PaymentMethod',
    'Notes',
  ];

  const escapeCsv = (val: string | number | undefined) => {
    if (val === undefined || val === null) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = transactions.map((tx) =>
    [
      tx.id,
      tx.date,
      tx.workspace,
      tx.type,
      tx.status,
      tx.activity,
      tx.category,
      tx.amount,
      accountMap.get(tx.accountId) || tx.accountId,
      tx.toAccountId ? accountMap.get(tx.toAccountId) || tx.toAccountId : '',
      tx.counterparty,
      tx.reference || '',
      tx.paymentMethod || '',
      tx.notes || '',
    ]
      .map(escapeCsv)
      .join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}
