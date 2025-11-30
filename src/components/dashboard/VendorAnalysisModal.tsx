import { useState, useEffect } from 'react';
import { X, Bot, AlertTriangle, CheckCircle, Save, Loader2, ShieldAlert } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface VendorAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: any;
  onSave: () => void;
}

export function VendorAnalysisModal({ isOpen, onClose, vendor, onSave }: VendorAnalysisModalProps) {
  const [loading, setLoading] = useState(false);
  const [riskSummary, setRiskSummary] = useState('');
  const [remediation, setRemediation] = useState('');
  const [riskLevel, setRiskLevel] = useState<'LOW' | 'HIGH'>('LOW');
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (vendor) {
      setRiskSummary(vendor.ai_risk_summary || '');
      setRemediation(vendor.remediation_plan || '');
      setRiskLevel(vendor.risk_status || 'LOW');
    }
  }, [vendor]);

  if (!isOpen || !vendor) return null;

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-single-vendor', {
        body: { companyVendorId: vendor.id }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Analysis failed");

      setRiskSummary(data.data.risk_summary);
      setRemediation(data.data.remediation_plan);
      
      // Auto-detect high risk
      if (data.data.risk_summary?.toLowerCase().includes('high risk') || 
          data.data.risk_summary?.toLowerCase().includes('non-conformit')) {
         setRiskLevel('HIGH');
      }

      toast.success("AI Analysis Complete");
    } catch (err: any) {
      console.error(err);
      toast.error(`Analysis failed: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('company_vendors')
        .update({
          ai_risk_summary: riskSummary,
          remediation_plan: remediation,
          risk_status: riskLevel,
          last_ai_analysis_at: new Date().toISOString()
        })
        .eq('id', vendor.id);

      if (error) throw error;
      
      toast.success("Risk Profile Updated");
      onSave(); 
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const hasEvidence = vendor.verification_status === 'VERIFIED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden border border-slate-200">
        
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-600" />
              Risk Analysis: {vendor.vendor?.company_name}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Review specific risks and set remediation actions.</p>
          </div>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          
          {!riskSummary && !analyzing && (
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-center">
              <Bot className="w-10 h-10 text-blue-600 mx-auto mb-3" />
              <h3 className="font-bold text-blue-900">Run AI Audit</h3>
              <p className="text-sm text-blue-700 mb-4 max-w-sm mx-auto">
                Scan uploaded documents for forced labour indicators.
              </p>
              <button 
                onClick={handleRunAnalysis}
                disabled={!hasEvidence}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {hasEvidence ? "Analyze Evidence Documents" : "Waiting for Evidence Upload"}
              </button>
            </div>
          )}

          {analyzing && (
            <div className="py-12 text-center">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-sm font-medium text-slate-600">Reading documents & identifying risks...</p>
            </div>
          )}

          {(riskSummary || remediation) && !analyzing && (
            <div className="space-y-5 animate-in slide-in-from-bottom-2">
              
              {/* Risk Level Toggle */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                    <label className="text-sm font-bold text-slate-700">Assigned Risk Level</label>
                    <p className="text-xs text-slate-500">Override based on analysis findings.</p>
                </div>
                <div className="flex bg-white rounded-lg border border-slate-300 p-1">
                    <button 
                        onClick={() => setRiskLevel('LOW')}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${riskLevel === 'LOW' ? 'bg-green-100 text-green-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        Low Risk
                    </button>
                    <button 
                        onClick={() => setRiskLevel('HIGH')}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${riskLevel === 'HIGH' ? 'bg-red-100 text-red-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        High Risk
                    </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <ShieldAlert size={14} className="text-slate-500" /> AI Risk Summary
                  </label>
                  <button onClick={handleRunAnalysis} className="text-xs text-blue-600 hover:underline font-medium">Re-run AI</button>
                </div>
                <textarea
                  value={riskSummary}
                  onChange={(e) => setRiskSummary(e.target.value)}
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm"
                  placeholder="Summarize key risk findings..."
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
                  <CheckCircle size={14} className="text-green-600" /> Remediation Plan
                </label>
                <textarea
                  value={remediation}
                  onChange={(e) => setRemediation(e.target.value)}
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white shadow-sm"
                  placeholder="List specific actions..."
                />
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 font-bold hover:bg-gray-200 rounded-lg text-sm">Cancel</button>
          <button 
            onClick={handleSave}
            disabled={loading || analyzing}
            className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-2 text-sm shadow-sm"
          >
            {loading ? 'Saving...' : <><Save size={16} /> Save & Update Badge</>}
          </button>
        </div>
      </div>
    </div>
  );
}