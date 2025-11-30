import { useState } from 'react';
import { X, FileText, Wand2, Download, Loader2, Edit3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { generateS211Report } from '../../lib/pdf-generator';
import { toast } from 'sonner';

interface ReportBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  cycleId: string | null;
  companyName: string;
  vendors: any[];
}

export function ReportBuilderModal({ isOpen, onClose, companyName, vendors }: ReportBuilderModalProps) {
  const [loading, setLoading] = useState(false);
  const [reportText, setReportText] = useState('');
  const [step, setStep] = useState<'intro' | 'draft'>('intro');

  if (!isOpen) return null;

  const handleGenerateDraft = async () => {
    setLoading(true);
    try {
      // Calculate Stats for the AI
      const highRisk = vendors.filter(v => v.risk_status === 'HIGH').length;
      const verified = vendors.filter(v => v.verification_status === 'VERIFIED').length;
      
      // Extract IDs to fetch specific evidence
      const vendorIds = vendors.map(v => v.id);

      const { data, error } = await supabase.functions.invoke('generate-ai-report', {
        body: { 
          companyName,
          vendorCount: vendors.length,
          highRiskCount: highRisk,
          verifiedCount: verified,
          vendorIds: vendorIds // <--- Passing IDs to backend
        }
      });
      
      if (error) throw error;
      setReportText(data.reportText);
      setStep('draft');
    } catch (err) {
      console.error(err);
      toast.error("AI Generation Failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    // 1. Get Logs (Optional: You could fetch real logs here if needed)
    const logs: any[] = []; 

    // 2. Generate PDF
    generateS211Report(companyName, vendors, logs, reportText); 
    
    toast.success("Report downloaded successfully!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" /> Annual Report Builder
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20}/></button>
        </div>

        {/* Content */}
        <div className="p-8 flex-1 overflow-y-auto">
          {step === 'intro' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wand2 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">AI-Powered Drafting</h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto text-lg leading-relaxed">
                We will analyze your <strong>{vendors.length} vendors</strong>, risk profiles, and verification data to draft the "Due Diligence" section of your S-211 Report.
              </p>
              <button 
                onClick={handleGenerateDraft}
                disabled={loading}
                className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center gap-3 mx-auto text-lg"
              >
                {loading ? <><Loader2 className="animate-spin" /> Analyzing Data...</> : <><Wand2 size={20} /> Generate Draft</>}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Edit3 size={16} className="text-blue-600"/> 
                  Review & Edit Draft
                </label>
                <span className="text-xs text-gray-400 font-medium">Part 1: Risk Assessment</span>
              </div>
              <textarea 
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                className="w-full h-96 p-5 border border-gray-300 rounded-xl font-mono text-sm leading-relaxed focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-gray-50/50"
              />
              <p className="text-xs text-gray-400 italic">
                * This text will be inserted into the official PDF template along with your data tables and attestation block.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'draft' && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-between items-center">
            <button onClick={() => setStep('intro')} className="text-gray-500 hover:text-gray-800 font-bold text-sm px-4">
              Back to Start
            </button>
            <button 
              onClick={handleDownloadPDF}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Download size={18} /> Download Final PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}