import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Briefcase,
  User,
  Calendar,
  Tag,
  Wallet,
  FileText,
  CheckCircle2,
  Clock,
  Repeat,
} from 'lucide-react';
import {
  Account,
  CashFlowActivity,
  CurrencyCode,
  Transaction,
  TransactionStatus,
  TransactionType,
  WorkspaceMode,
} from '../types';
import { CATEGORIES } from '../data/initialData';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id' | 'createdAt'>, existingId?: string) => void;
  accounts: Account[];
  defaultWorkspace: WorkspaceMode;
  currency: CurrencyCode;
  editingTransaction?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  accounts,
  defaultWorkspace,
  currency,
  editingTransaction,
}) => {
  const today = new Date().toISOString().split('T')[0];

  const [workspace, setWorkspace] = useState<WorkspaceMode>(defaultWorkspace);
  const [type, setType] = useState<TransactionType>('outflow');
  const [date, setDate] = useState<string>(today);
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [status, setStatus] = useState<TransactionStatus>('cleared');
  const [activity, setActivity] = useState<CashFlowActivity>('operating');
  const [counterparty, setCounterparty] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');
  const [notes, setNotes] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurringFrequency, setRecurringFrequency] = useState<
    'weekly' | 'monthly' | 'quarterly' | 'yearly'
  >('monthly');

  const workspaceAccounts = accounts.filter((a) => a.workspace === workspace);
  const availableCategories = CATEGORIES.filter(
    (c) => c.workspace === workspace && (type === 'transfer' ? false : c.type === type)
  );

  useEffect(() => {
    if (editingTransaction) {
      setWorkspace(editingTransaction.workspace);
      setType(editingTransaction.type);
      setDate(editingTransaction.date);
      setAmount(String(editingTransaction.amount));
      setCategory(editingTransaction.category);
      setAccountId(editingTransaction.accountId);
      setToAccountId(editingTransaction.toAccountId || '');
      setStatus(editingTransaction.status);
      setActivity(editingTransaction.activity);
      setCounterparty(editingTransaction.counterparty);
      setReference(editingTransaction.reference || '');
      setPaymentMethod(editingTransaction.paymentMethod || 'Bank Transfer');
      setNotes(editingTransaction.notes || '');
      setIsRecurring(Boolean(editingTransaction.isRecurring));
      setRecurringFrequency(editingTransaction.recurringFrequency || 'monthly');
    } else {
      setWorkspace(defaultWorkspace);
      setType('outflow');
      setDate(new Date().toISOString().split('T')[0]);
      setAmount('');
      setCounterparty('');
      setReference('');
      setNotes('');
      setStatus('cleared');
      setIsRecurring(false);
    }
  }, [editingTransaction, defaultWorkspace, isOpen]);

  // Keep accountId valid when workspace changes
  useEffect(() => {
    const validAccs = accounts.filter((a) => a.workspace === workspace);
    if (validAccs.length > 0 && !validAccs.some((a) => a.id === accountId)) {
      setAccountId(validAccs[0].id);
      if (validAccs.length > 1) {
        setToAccountId(validAccs[1].id);
      }
    }
  }, [workspace, accounts, accountId]);

  // Keep category valid when workspace or type changes
  useEffect(() => {
    if (type === 'transfer') {
      setCategory('Internal Transfer');
      setActivity('financing');
      return;
    }
    const matching = CATEGORIES.filter((c) => c.workspace === workspace && c.type === type);
    if (matching.length > 0 && !matching.some((c) => c.name === category)) {
      setCategory(matching[0].name);
      setActivity(matching[0].defaultActivity);
    }
  }, [workspace, type]);

  if (!isOpen) return null;

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    const found = CATEGORIES.find((c) => c.name === val && c.workspace === workspace);
    if (found) {
      setActivity(found.defaultActivity);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return;
    if (!accountId) return;

    const finalCategory =
      type === 'transfer'
        ? 'Internal Transfer'
        : category === '__custom__'
        ? customCategory.trim() || 'Uncategorized'
        : category;

    onSave(
      {
        date,
        type,
        amount: numericAmount,
        category: finalCategory,
        accountId,
        toAccountId: type === 'transfer' ? toAccountId : undefined,
        workspace,
        status,
        activity,
        counterparty:
          counterparty.trim() ||
          (type === 'transfer' ? 'Account Transfer' : finalCategory),
        reference: reference.trim() || undefined,
        paymentMethod,
        notes: notes.trim() || undefined,
        isRecurring,
        recurringFrequency: isRecurring ? recurringFrequency : undefined,
      },
      editingTransaction?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/90">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {editingTransaction ? 'Edit Cash Flow Entry' : 'Record Cash Flow Transaction'}
            </h2>
            <p className="text-xs text-slate-400">
              Track every inflow, expense, invoice, or account transfer end-to-end
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Top Switchers: Workspace & Transaction Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Workspace Selector */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setWorkspace('personal')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition ${
                  workspace === 'personal'
                    ? 'bg-violet-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="h-3.5 w-3.5" />
                Personal
              </button>
              <button
                type="button"
                onClick={() => setWorkspace('business')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition ${
                  workspace === 'business'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Briefcase className="h-3.5 w-3.5" />
                Business
              </button>
            </div>

            {/* Transaction Type Selector */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setType('inflow')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-medium transition ${
                  type === 'inflow'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowDownLeft className="h-3.5 w-3.5" />
                Cash In
              </button>
              <button
                type="button"
                onClick={() => setType('outflow')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-medium transition ${
                  type === 'outflow'
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                Cash Out
              </button>
              <button
                type="button"
                onClick={() => setType('transfer')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-medium transition ${
                  type === 'transfer'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                Transfer
              </button>
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Amount ({currency}) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-lg font-semibold text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Transaction Date *
              </label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Account(s) & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {type === 'transfer' ? 'From Account / Wallet *' : 'Account / Wallet *'}
              </label>
              <div className="relative">
                <Wallet className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                >
                  {workspaceAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.institution || acc.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {type === 'transfer' ? (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  To Destination Account *
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                >
                  {workspaceAccounts
                    .filter((a) => a.id !== accountId)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.institution || acc.type})
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Category *
                </label>
                <div className="relative">
                  <Tag className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {availableCategories.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    <option value="__custom__">+ Custom Category...</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {category === '__custom__' && type !== 'transfer' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Custom Category Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Legal Retainer, Equipment Rental..."
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          )}

          {/* Counterparty & Reference/Invoice # */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {type === 'inflow'
                  ? 'Client / Payer / Source *'
                  : type === 'outflow'
                  ? 'Vendor / Payee / Merchant *'
                  : 'Transfer Description'}
              </label>
              <input
                type="text"
                required={type !== 'transfer'}
                placeholder={
                  type === 'inflow'
                    ? 'e.g., Apex Global Partners, Employer'
                    : 'e.g., AWS Cloud, Supermarket, Landlord'
                }
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Invoice / Reference # (Optional)
              </label>
              <div className="relative">
                <FileText className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g., INV-2026-104 or PO-88"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Cash Settlement Status, Activity Classification & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Settlement Status
              </label>
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setStatus('cleared')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition ${
                    status === 'cleared'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Cleared
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('pending')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition ${
                    status === 'pending'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  Pending
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Cash Flow Activity
              </label>
              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value as CashFlowActivity)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="operating">Operating Cash Flow</option>
                <option value="investing">Investing / CapEx</option>
                <option value="financing">Financing / Reserve / Tax</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="Bank Transfer">Bank / Wire Transfer</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Corporate Card">Corporate / Credit Card</option>
                <option value="E-Wallet">E-Wallet / QRIS</option>
                <option value="Cash">Physical Cash</option>
                <option value="Auto-Debit">Auto-Debit / ACH</option>
              </select>
            </div>
          </div>

          {/* Recurring & Notes */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-200">
                <Repeat className="h-3.5 w-3.5 text-emerald-400" />
                Recurring Cash Flow Item (Subscription, Retainer, Rent, Payroll)
              </span>
            </label>

            {isRecurring && (
              <select
                value={recurringFrequency}
                onChange={(e) =>
                  setRecurringFrequency(
                    e.target.value as 'weekly' | 'monthly' | 'quarterly' | 'yearly'
                  )
                }
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-white"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Notes / Memo (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Add context, tax deductibility notes, or project milestone details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 transition"
            >
              {editingTransaction ? 'Save Changes' : 'Record Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
