import { Gavel, CheckCircle, XCircle, AlertTriangle, Calendar, User } from 'lucide-react';
import { FinalDecision } from '../../pages/MSPAuditPage'; // Import type if needed, or define locally

interface DecisionTabProps {
  decision: FinalDecision;
  onChange: (d: FinalDecision) => void;
}

export function DecisionTab({ decision, onChange }: DecisionTabProps) {
  
  const updateField = (field: keyof FinalDecision, value: any) => {
    onChange({ ...decision, [field]: value });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header / Context */}
      <div className="bg-indigo-900 text-white p-8 rounded-t-xl shadow-lg">
         <h2 className="text-2xl font-bold flex items-center gap-3 mb-2">
            <Gavel className="text-indigo-300" /> Compliance Determination
         </h2>
         <p className="text-indigo-200 text-sm opacity-90">
            This section serves as the formal conclusion of the Privacy Impact Assessment (PIA). 
            It must be completed by the designated Privacy Officer or Auditor.
         </p>
      </div>

      <div className="bg-white border border-slate-200 border-t-0 rounded-b-xl p-8 shadow-sm space-y-8">
         
         {/* 1. Approval Status */}
         <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">Project Status</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { val: 'Approved', icon: CheckCircle, color: 'bg-green-50 border-green-200 text-green-700', desc: 'Proceed with launch' },
                    { val: 'Conditional', icon: AlertTriangle, color: 'bg-amber-50 border-amber-200 text-amber-700', desc: 'Approved with conditions' },
                    { val: 'Rejected', icon: XCircle, color: 'bg-red-50 border-red-200 text-red-700', desc: 'Do not proceed' }
                ].map((opt) => (
                    <button
                        key={opt.val}
                        onClick={() => updateField('approval_status', opt.val)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                            decision.approval_status === opt.val ? opt.color + ' ring-2 ring-offset-2 ring-indigo-500/20' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-1 font-bold">
                            <opt.icon size={18} /> {opt.val}
                        </div>
                        <div className="text-xs opacity-80">{opt.desc}</div>
                    </button>
                ))}
            </div>
         </div>

         {/* 2. Global Residual Risk */}
         <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
                <h3 className="font-bold text-slate-800 mb-1">Overall Residual Risk</h3>
                <p className="text-xs text-slate-500">
                    Considering all implemented controls, what is the remaining risk level for the organization?
                </p>
            </div>
            <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                {['Low', 'Medium', 'High'].map(level => (
                    <button
                        key={level}
                        onClick={() => updateField('risk_level', level)}
                        className={`px-6 py-2 rounded-md text-sm font-bold transition-colors ${
                            decision.risk_level === level 
                                ? (level === 'High' ? 'bg-red-100 text-red-700' : level === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700')
                                : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        {level}
                    </button>
                ))}
            </div>
         </div>

         {/* 3. Comments & Sign-off */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Executive Summary / Conditions</label>
                <textarea 
                    className="w-full h-32 p-4 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    placeholder="e.g. Approved pending the implementation of MFA on the Accounting module by Q4..."
                    value={decision.comments}
                    onChange={(e) => updateField('comments', e.target.value)}
                />
             </div>

             <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Auditor / DPO Name</label>
                <div className="relative">
                    <User className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input 
                        type="text"
                        className="w-full pl-10 p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="John Doe"
                        value={decision.auditor_name}
                        onChange={(e) => updateField('auditor_name', e.target.value)}
                    />
                </div>
             </div>
             
             <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Date of Decision</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input 
                        type="date"
                        className="w-full pl-10 p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-600"
                        defaultValue={new Date().toISOString().split('T')[0]}
                    />
                </div>
             </div>
         </div>

      </div>
    </div>
  );
}