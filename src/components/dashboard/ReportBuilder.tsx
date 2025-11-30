import { useState } from 'react';
import { X, FileText, Wand2, Download, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { generateS211Report } from '../../lib/pdf-generator';
import { toast } from 'sonner';

interface ReportBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  cycleId: string | null;
  companyName: string;
  vendors: any[]; // Pass the vendor data for the PDF
}

export function ReportBuilderModal({ isOpen, onClose, cycleId, companyName, vendors }: ReportBuilderModalProps) {
  const [loading, setLoading] = useState(false);
  const [reportText, setReportText] = useState('');
  const [step, setStep] = useState<'intro' | 'draft'>('intro');

  if (!isOpen) return null;

  const handleGenerateDraft = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-report', {
        body: { cycleId, companyName }
      });
      
      if (error) throw error;
      setReportText(data.reportText);
      setStep('draft');
    } catch (err) {
      toast.error("AI Generation Failed. Using template.");
      setReportText("We have assessed our supply chain..."); // Fallback
      setStep('draft');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    // We pass the "reportText" as the "Attestation" or a new section in the PDF
    // You'll need to update pdf-generator.ts to accept this extra string
    generateS211Report(companyName, vendors, [], reportText); 
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" /> S-211 Report Generator
          </h2>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
        </div>

        {/* Content */}
        <div className="p-8 flex-1 overflow-y-auto">
          {step === 'intro' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wand2 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">AI Draft Generation</h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                We will analyze your {vendors.length} vendors, risk tags, and collected evidence to write a legally-defensible "Steps Taken" summary for your Annual Report.
              </p>
              <button 
                onClick={handleGenerateDraft}
                disabled={loading}
                className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2 mx-auto"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Wand2 size={18} />}
                Generate Draft with AI
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-sm font-bold text-gray-700">Review & Edit (Due Diligence Section)</label>
                <span className="text-xs text-gray-400">Markdown Supported</span>
              </div>
              <textarea 
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                className="w-full h-80 p-4 border border-gray-300 rounded-lg font-mono text-sm leading-relaxed focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer (Only for Draft Step) */}
        {step === 'draft' && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-3">
            <button onClick={() => setStep('intro')} className="text-gray-600 px-4 py-2 font-bold text-sm">Back</button>
            <button 
              onClick={handleDownloadPDF}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Download size={16} /> Download Final PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}