import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  UploadCloud,
  DownloadCloud,
  Copy,
  Check,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Code2,
} from 'lucide-react';
import { Account, CategoryBudget, GoogleSheetsConfig, Transaction } from '../types';
import { GOOGLE_APPS_SCRIPT_CODE } from '../data/initialData';
import { exportTransactionsToCSV } from '../utils/formatters';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleSheetsConfig;
  onUpdateConfig: (cfg: Partial<GoogleSheetsConfig>) => void;
  onPushToSheets: () => Promise<void>;
  onPullFromSheets: () => Promise<void>;
  transactions: Transaction[];
  accounts: Account[];
  budgets: CategoryBudget[];
  onImportCSV: (rows: Transaction[]) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onPushToSheets,
  onPullFromSheets,
  transactions,
  accounts,
  onImportCSV,
}) => {
  const [webAppUrl, setWebAppUrl] = useState(config.webAppUrl || '');
  const [sheetUrl, setSheetUrl] = useState(config.sheetUrl || '');
  const [copiedScript, setCopiedScript] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [csvFeedback, setCsvFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveConnection = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig({
      webAppUrl: webAppUrl.trim(),
      sheetUrl: sheetUrl.trim() || undefined,
      syncStatus: webAppUrl.trim() ? 'connected' : 'disconnected',
      lastError: undefined,
    });
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleDownloadCSV = () => {
    const csv = exportTransactionsToCSV(transactions, accounts);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cashflow-pro-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;
      const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
      if (lines.length <= 1) return;

      const imported: Transaction[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
        if (cols.length < 8) continue;
        const amount = parseFloat(cols[7]);
        if (isNaN(amount) || amount <= 0) continue;

        imported.push({
          id: cols[0] || `tx-imp-${Date.now()}-${i}`,
          date: cols[1] || new Date().toISOString().split('T')[0],
          workspace: cols[2] === 'business' ? 'business' : 'personal',
          type:
            cols[3] === 'inflow' || cols[3] === 'transfer' ? cols[3] : 'outflow',
          status: cols[4] === 'pending' ? 'pending' : 'cleared',
          activity:
            cols[5] === 'investing' || cols[5] === 'financing'
              ? cols[5]
              : 'operating',
          category: cols[6] || 'Uncategorized',
          amount,
          accountId: accounts[0]?.id || 'acc-pers-main',
          counterparty: cols[10] || cols[6] || 'Imported Entry',
          reference: cols[11] || undefined,
          paymentMethod: cols[12] || 'Bank Transfer',
          notes: cols[13] || undefined,
          createdAt: new Date().toISOString(),
        });
      }

      if (imported.length > 0) {
        onImportCSV(imported);
        setCsvFeedback(`Imported ${imported.length} transactions from CSV!`);
        setTimeout(() => setCsvFeedback(null), 4000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Google Sheets Live Integration
              </h2>
              <p className="text-xs text-slate-400">
                2-way sync your Transactions, Accounts & Budgets with any Google Sheet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* Status Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="flex items-center gap-3">
              {config.syncStatus === 'connected' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              ) : config.syncStatus === 'error' ? (
                <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
              ) : (
                <FileSpreadsheet className="h-5 w-5 text-slate-400 shrink-0" />
              )}
              <div>
                <div className="text-sm font-medium text-white">
                  {config.syncStatus === 'connected'
                    ? 'Connected to Google Sheets Bridge'
                    : config.syncStatus === 'syncing'
                    ? 'Syncing with Google Sheets...'
                    : config.syncStatus === 'error'
                    ? 'Sync Error'
                    : 'Local Storage Active (Connect Google Sheet below)'}
                </div>
                <div className="text-xs text-slate-400">
                  {config.lastSyncedAt
                    ? `Last synced: ${new Date(config.lastSyncedAt).toLocaleString()}`
                    : 'All changes are also safely saved in your browser local storage.'}
                  {config.lastError && (
                    <span className="block text-rose-400 mt-0.5">{config.lastError}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {config.sheetUrl && (
                <a
                  href={config.sheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 transition"
                >
                  Open Sheet <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              <button
                type="button"
                disabled={!config.webAppUrl || config.syncStatus === 'syncing'}
                onClick={onPushToSheets}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-40 transition"
              >
                {config.syncStatus === 'syncing' ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <UploadCloud className="h-3.5 w-3.5" />
                )}
                Push to Sheet
              </button>
              <button
                type="button"
                disabled={!config.webAppUrl || config.syncStatus === 'syncing'}
                onClick={onPullFromSheets}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-40 transition"
              >
                <DownloadCloud className="h-3.5 w-3.5" />
                Pull from Sheet
              </button>
            </div>
          </div>

          {/* Connection Form */}
          <form onSubmit={handleSaveConnection} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Google Apps Script Web App URL (for 2-Way Sync)
              </label>
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                value={webAppUrl}
                onChange={(e) => setWebAppUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Google Sheet Link (Optional shortcut button)
                </label>
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={config.autoSync}
                    onChange={(e) => onUpdateConfig({ autoSync: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500"
                  />
                  Auto-push on every new transaction
                </label>

                <button
                  type="submit"
                  className="rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 text-xs font-semibold text-white transition"
                >
                  Save Connection
                </button>
              </div>
            </div>
          </form>

          {/* 60-Second Google Sheet Setup Guide */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  How to connect any Google Sheet in 60 seconds (No API Key needed)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowScript(!showScript)}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  {showScript ? 'Hide Apps Script' : 'View Apps Script'}
                </button>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-600/30 transition"
                >
                  {copiedScript ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Copied Code.gs!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copy Apps Script
                    </>
                  )}
                </button>
              </div>
            </div>

            <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside">
              <li>
                Open a new or existing Google Sheet and click{' '}
                <span className="text-slate-200 font-medium">Extensions → Apps Script</span>.
              </li>
              <li>
                Click <span className="text-emerald-300 font-medium">Copy Apps Script</span> above,
                paste it into <code className="text-slate-200">Code.gs</code>, and save.
              </li>
              <li>
                Click <span className="text-slate-200 font-medium">Deploy → New deployment</span>,
                choose <span className="text-slate-200 font-medium">Web app</span>, set{' '}
                <em>Who has access</em> to <span className="text-slate-200 font-medium">Anyone</span>,
                and click Deploy.
              </li>
              <li>
                Paste the generated Web App URL above and click{' '}
                <span className="text-emerald-300 font-medium">Push to Sheet</span> — it will
                automatically create and format the <code className="text-slate-200">Transactions</code>,{' '}
                <code className="text-slate-200">Accounts</code>, and{' '}
                <code className="text-slate-200">Budgets</code> tabs!
              </li>
            </ol>

            {showScript && (
              <pre className="mt-3 max-h-56 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-[11px] text-slate-300 font-mono">
                {GOOGLE_APPS_SCRIPT_CODE}
              </pre>
            )}
          </div>

          {/* Direct CSV Import / Export for Google Sheets */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-800">
            <div>
              <h4 className="text-xs font-semibold text-slate-200">
                Direct Google Sheets CSV Import & Export
              </h4>
              <p className="text-xs text-slate-400">
                Download a ready-to-open `.csv` for Google Sheets or import rows from an existing sheet.
              </p>
              {csvFeedback && (
                <p className="text-xs text-emerald-400 mt-1 font-medium">{csvFeedback}</p>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleDownloadCSV}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </button>

              <label className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 cursor-pointer transition">
                <Upload className="h-3.5 w-3.5" />
                Import CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
