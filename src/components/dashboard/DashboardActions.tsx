import { Plus, Upload, Send, Lock, Download, FileText } from 'lucide-react';

interface DashboardActionsProps {
  onManualAdd: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onVerify: () => void;
  onDownloadTemplate: () => void;
  onGenerateReport: () => void;
  uploading: boolean;
  selectedCount: number;
  isPremium: boolean;
}

export function DashboardActions({
  onManualAdd,
  onFileUpload,
  onVerify,
  onDownloadTemplate,
  onGenerateReport,
  uploading,
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
        {/* Report Generator (New Feature) */}
        <button
            onClick={onGenerateReport}
            className="flex items-center px-4 py-2.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-bold text-slate-700"
            title="Download S-211 PDF"
        >
            <FileText className="w-4 h-4 mr-2" /> Report
        </button>

        {/* Manual Add */}
        <button
          onClick={onManualAdd}
          className="flex items-center px-4 py-2.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-bold text-slate-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Vendor
        </button>

        {/* Import CSV */}
        <div className="relative group">
          <label className="flex items-center px-4 py-2.5 bg-white border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors shadow-sm text-sm font-bold text-slate-700">
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Analyzing...' : 'Import CSV'}
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={onFileUpload}
            />
          </label>
          {/* Tooltip for Template */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-xl border border-slate-200 hidden group-hover:block z-20 p-2">
            <button
              onClick={onDownloadTemplate}
              className="text-xs text-blue-600 hover:underline flex items-center w-full font-medium"
            >
              <Download size={12} className="mr-1" /> Download CSV Template
            </button>
          </div>
        </div>

        {/* Verify Action (The Money Button) */}
        <button
          onClick={onVerify}
          disabled={selectedCount === 0}
          className={`flex items-center px-5 py-2.5 rounded-lg shadow-sm text-sm font-bold transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
            isPremium
              ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200'
              : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {isPremium ? (
            <Send className="w-4 h-4 mr-2" />
          ) : (
            <Lock className="w-4 h-4 mr-2 text-amber-400" />
          )}
          Verify Selected ({selectedCount})
        </button>
      </div>
    </div>
  );
}