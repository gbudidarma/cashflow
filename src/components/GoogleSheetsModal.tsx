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
    a.download = `cashflow-export-${new Date().toISOString().split('T')[0]}.csv`;
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
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center bg-slate-950/85 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <div className="relative w-full h-[94vh] sm:h-auto sm:max-h-[90vh] sm:max-w-3xl rounded-t-2xl sm:rounded-2xl border-t sm:border border-slate-800 bg-slate-900 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 sm:px-6 py-3.5 bg-slate-900/95 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
              <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-white">
                Google Sheets Sync
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                2-Way Live Sync & CSV Import/Export
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition touch-manipulation"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Status Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 sm:p-4">
            <div className="flex items-center gap-3">
              {config.syncStatus === 'connected' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              ) : config.syncStatus === 'error' ? (
                <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
              ) : (
                <FileSpreadsheet className="h-5 w-5 text-slate-400 shrink-0" />
              )}
              <div>
                <div className="text-xs sm:text-sm font-medium text-white">
                  {config.syncStatus === 'connected'
                    ? 'Connected to Google Sheets'
                    : config.syncStatus === 'syncing'
                    ? 'Syncing with Google Sheets...'
                    : config.syncStatus === 'error'
                    ? 'Sync Error'
                    : 'Local Storage Active'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {config.lastSyncedAt
                    ? `Last synced: ${new Date(config.lastSyncedAt).toLocaleTimeString()}`
                    : 'Connect your Google Sheet below to enable live backup.'}
                  {config.lastError && (
                    <span className="block text-rose-400 mt-0.5">{config.lastError}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {config.sheetUrl && (
                <a
                  href={config.sheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 transition"
                >
                  Open Sheet <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <button
                type="button"
                disabled={!config.webAppUrl || config.syncStatus === 'syncing'}
                onClick={onPushToSheets}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-40 transition"
              >
                {config.syncStatus === 'syncing' ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <UploadCloud className="h-3.5 w-3.5" />
                )}
                Push to Sheet
              </button>
              <button
                type="button"
                disabled={!config.webAppUrl || config.syncStatus === 'syncing'}
                onClick={onPullFromSheets}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-40 transition"
              >
                <DownloadCloud className="h-3.5 w-3.5" />
                Pull from Sheet
              </button>
            </div>
          </div>

          {/* Connection Form */}
          <form onSubmit={handleSaveConnection} className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Google Apps Script Web App URL
              </label>
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                value={webAppUrl}
                onChange={(e) => setWebAppUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-base sm:text-xs text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Google Sheet Link (Optional shortcut)
                </label>
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-base sm:text-xs text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={config.autoSync}
                    onChange={(e) => onUpdateConfig({ autoSync: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500"
                  />
                  Auto-push on new entries
                </label>

                <button
                  type="submit"
                  className="rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 py-2 text-xs font-semibold text-white transition"
                >
                  Save URL
                </button>
              </div>
            </div>
          </form>

          {/* 60-Second Setup Guide */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 sm:p-4 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  How to connect in 60 seconds (No API key needed)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowScript(!showScript)}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  {showScript ? 'Hide Script' : 'View Script'}
                </button>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/20 border border-emerald-500/30 px-2.5 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-600/30 transition"
                >
                  {copiedScript ? (
                    <>
                      <Check className="h-3 w-3" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> Copy Script
                    </>
                  )}
                </button>
              </div>
            </div>

            <ol className="text-[11px] sm:text-xs text-slate-400 space-y-1 list-decimal list-inside">
              <li>Open any Google Sheet and click <span className="text-slate-200">Extensions → Apps Script</span>.</li>
              <li>Click <span className="text-emerald-300">Copy Script</span> above and paste into <code className="text-slate-200">Code.gs</code>.</li>
              <li>Click <span className="text-slate-200">Deploy → New deployment</span> → Web app (Who has access: <span className="text-slate-200">Anyone</span>).</li>
              <li>Paste the web app URL above and click <span className="text-emerald-300">Push to Sheet</span>!</li>
            </ol>

            {showScript && (
              <pre className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-[10px] text-slate-300 font-mono">
                {GOOGLE_APPS_SCRIPT_CODE}
              </pre>
            )}
          </div>

          {/* CSV Import / Export */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <div>
              <h4 className="text-xs font-semibold text-slate-200">
                Direct CSV Backup & Restore
              </h4>
              <p className="text-[11px] text-slate-400">
                Download `.csv` file or import rows from an existing spreadsheet.
              </p>
              {csvFeedback && (
                <p className="text-xs text-emerald-400 mt-1 font-medium">{csvFeedback}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadCSV}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </button>

              <label className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 cursor-pointer transition">
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
