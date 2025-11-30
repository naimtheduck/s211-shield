// src/components/dashboard/CampaignReviewModal.tsx

import { useState } from 'react';
import { X, Mail, Send, Eye } from 'lucide-react';

interface CampaignReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (subject: string, body: string) => Promise<void>;
  onTest: (subject: string, body: string) => Promise<void>;
  recipientCount: number;
  recipientLabel?: string;
}

const DEFAULT_SUBJECT = "Action Required: Supply Chain Compliance Verification";
const DEFAULT_BODY = `Dear {{Company Name}},

As part of our commitment to ethical sourcing and in compliance with Canada's Bill S-211, we require all Tier-1 suppliers to certify their adherence to our Supplier Code of Conduct.

Please complete the verification process at the secure link below:
{{Link}}

This process includes:
1. Reviewing our Code of Conduct
2. Certifying operations are free from forced labour
3. Uploading any relevant certifications

Failure to complete this verification by {{Deadline}} may impact our ability to continue procurement activities.

Thank you for your cooperation.

Sincerely,
Compliance Team`;

export function CampaignReviewModal({ 
  isOpen, 
  onClose, 
  onSend, 
  onTest,
  recipientCount,
  recipientLabel 
}: CampaignReviewModalProps) {
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    setLoading(true);
    await onSend(subject, body);
    setLoading(false);
    onClose();
  };

  const handleTest = async () => {
    setTestLoading(true);
    await onTest(subject, body);
    setTestLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Review Campaign
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Sending to <span className="font-bold text-gray-700">{recipientLabel || `${recipientCount} recipients`}</span>.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg outline-none font-medium text-gray-900" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Message</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} className="w-full h-64 p-4 border border-gray-300 rounded-lg outline-none font-mono text-sm resize-none text-gray-700" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-between items-center">
          <button onClick={handleTest} disabled={testLoading} className="text-slate-600 hover:text-slate-800 text-sm font-bold flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-200">
            {testLoading ? 'Sending...' : <><Eye size={16}/> Send Test to Me</>}
          </button>
          <button onClick={handleSend} disabled={loading} className="bg-blue-600 text-white hover:bg-blue-700 text-sm font-bold px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            {loading ? 'Processing...' : <><Send size={16}/> Send Official Request</>}
          </button>
        </div>
      </div>
    </div>
  );
}