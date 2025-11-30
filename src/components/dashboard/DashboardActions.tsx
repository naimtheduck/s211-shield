import { Plus, Upload, Send, Lock, Download, FileText, Wand2 } from 'lucide-react';

interface DashboardActionsProps {
  onManualAdd: () => void;
  onImportClick: () => void;
  onVerify: () => void;
  onAnalyzeBatch: () => void;
  onDownloadTemplate: () => void;
  onGenerateReport: () => void;
  uploading: boolean;
  selectedCount: number;
  isPremium: boolean;
}

export function DashboardActions({
  onManualAdd,
  onImportClick,
  onVerify,
  onAnalyzeBatch,
  onDownloadTemplate,
  onGenerateReport,
  selectedCount,
  isPremium,
}: DashboardActionsProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Compliance Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor Tier-1 supplier risks and track remediation status.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {/* PRIMARY ACTION: REPORT */}
        <button
            onClick={onGenerateReport}
            className="flex items-center px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl text-sm font-bold transform hover:-translate-y-0.5"
        >
            <FileText className="w-4 h-4 mr-2" /> Generate Report
        </button>

        <button
          onClick={onManualAdd}
          className="flex items-center px-4 py-2.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-bold text-slate-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Vendor
        </button>

        <div className="relative group">
          <button
            onClick={onImportClick}
            className="flex items-center px-4 py-2.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-bold text-slate-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </button>
          
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-xl border border-slate-200 hidden group-hover:block z-20 p-2">
            <button
              onClick={onDownloadTemplate}
              className="text-xs text-blue-600 hover:underline flex items-center w-full font-medium"
            >
            </button>
          </div>
        </div>

        {/* Batch Actions */}
        <button
          onClick={onAnalyzeBatch}
          disabled={selectedCount === 0}
          className={`flex items-center px-5 py-2.5 rounded-lg shadow-sm text-sm font-bold transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
            isPremium
              ? 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-purple-200'
              : 'bg-slate-200 text-slate-400'
          }`}
        >
          {isPremium ? <Wand2 className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
          Analyze ({selectedCount})
        </button>

        <button
          onClick={onVerify}
          disabled={selectedCount === 0}
          className={`flex items-center px-5 py-2.5 rounded-lg shadow-sm text-sm font-bold transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
            isPremium
              ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200'
              : 'bg-slate-200 text-slate-400'
          }`}
        >
          {isPremium ? <Send className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
          Send email ({selectedCount})
        </button>
      </div>
    </div>
  );
}