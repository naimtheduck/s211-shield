import { useState } from 'react';
import { X, FileText, Wand2, Download, Loader2, PenLine } from 'lucide-react';
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
      const highRisk = vendors.filter(v => v.risk_status === 'HIGH').length;
      const verified = vendors.filter(v => v.verification_status === 'VERIFIED').length;
      const vendorIds = vendors.map(v => v.id);

      const { data, error } = await supabase.functions.invoke('generate-ai-report', {
        body: { 
          companyName,
          vendorCount: vendors.length,
          highRiskCount: highRisk,
          verifiedCount: verified,
          vendorIds
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
    const logs: any[] = [];
    generateS211Report(companyName, vendors, logs, reportText); 
    toast.success("Report downloaded successfully!");
    onClose();
  };

  return (
    // 1. Changed max-width to 7xl (matches dashboard) and height to 90vh
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                 <FileText className="w-6 h-6" />
              </div>
              Annual Report Builder
            </h2>
            <p className="text-sm text-gray-500 mt-1 ml-14">Drafting Due Diligence for <span className="font-medium text-gray-900">{companyName}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-gray-50/30 relative">
          {step === 'intro' ? (
            <div className="flex flex-col items-center justify-center h-full p-12 text-center">
              <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mb-8 shadow-sm ring-4 ring-blue-50/50">
                <Wand2 className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">AI Legal Drafter</h3>
              <p className="text-gray-600 mb-10 max-w-xl text-lg leading-relaxed">
                We will analyze your <strong>{vendors.length} verified vendors</strong>, identified risks, and collected evidence documents to write a legally-defensible "Risk Assessment" section for your S-211 Report.
              </p>
              <button 
                onClick={handleGenerateDraft}
                disabled={loading}
                className="bg-slate-900 text-white px-12 py-5 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl flex items-center gap-3 text-xl transform hover:-translate-y-0.5"
              >
                {loading ? <><Loader2 className="animate-spin" /> Analyzing Supply Chain...</> : <><Wand2 size={24} /> Generate Draft</>}
              </button>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Toolbar */}
              <div className="px-8 py-4 bg-white border-b border-gray-200 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <PenLine size={16} className="text-blue-600"/> 
                    Editor
                  </label>
                  <span className="h-4 w-px bg-gray-300 mx-2"></span>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Part 1: Risk Assessment
                  </span>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-100 flex items-center gap-1.5">
                  <Wand2 size={12}/> AI Generated
                </span>
              </div>
              
              {/* Huge Text Area */}
              <div className="flex-1 p-8 overflow-hidden">
                 <textarea 
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  className="w-full h-full p-8 bg-white border border-gray-200 rounded-xl text-lg text-slate-800 leading-relaxed focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none resize-none shadow-sm font-serif"
                  placeholder="Report draft will appear here..."
                  spellCheck={false}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'draft' && (
          <div className="px-8 py-5 border-t border-gray-100 bg-white flex justify-between items-center shrink-0">
             <div className="text-xs text-gray-400 italic">
                * This text will be inserted into the final PDF template.
             </div>
            <div className="flex gap-3">
                <button 
                    onClick={() => setStep('intro')} 
                    className="px-6 py-2.5 text-slate-500 hover:text-slate-800 font-semibold text-sm transition-colors"
                >
                  Regenerate
                </button>
                <button 
                onClick={handleDownloadPDF}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg text-base"
                >
                  <Download size={20} /> Download Final PDF
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}