import { 
  AlertTriangle, CheckCircle, Clock, FileText, Trash2, 
  Lock, BellRing, Send, History, Wand // Replaced Wand2 with Wand for compatibility
} from 'lucide-react';
import { useAuditStore } from '../../lib/store';

// Ensure this matches the structure passed from Dashboard
export interface Vendor {
  id: string;
  company_name: string;
  contact_email: string;
  country: string;
  risk_status: 'HIGH' | 'LOW';
  verification_status: 'PENDING' | 'SENT' | 'VERIFIED';
  ai_risk_summary?: string;
  remediation_plan?: string;
}

interface VendorTableProps {
  vendors: Vendor[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleAll: (selected: boolean) => void;
  onDelete: (id: string) => void;
  onTriggerUpsell: () => void;
  onSendSingle: (id: string) => void;
  onViewHistory: (id: string) => void;
  onAnalyze: (vendorId: string) => void;
  onViewCert: (vendorId: string) => void;
}

export function VendorTable({ 
  vendors, 
  selectedIds, 
  onToggleSelect, 
  onToggleAll,
  onDelete, 
  onTriggerUpsell,
  onSendSingle,
  onViewHistory,
  onAnalyze,
  onViewCert
}: VendorTableProps) {
  
  const isPremium = useAuditStore((state) => state.isPremium);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-visible">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50/80">
          <tr>
            <th className="w-12 px-6 py-4">
              <input 
                type="checkbox" 
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                onChange={(e) => onToggleAll(e.target.checked)}
                checked={vendors.length > 0 && selectedIds.size === vendors.length}
              />
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Vendor Entity</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Risk Analysis</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-100">
          {vendors.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-16 text-center text-slate-400 text-sm">
                No vendors found. Import a CSV to begin analysis.
              </td>
            </tr>
          ) : vendors.map((vendor) => {
            const isVerified = vendor.verification_status === 'VERIFIED';
            
            return (
              <tr key={vendor.id} className="hover:bg-slate-50/50 transition-colors group">
                {/* CHECKBOX */}
                <td className="px-6 py-4 align-middle">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.has(vendor.id)}
                    onChange={() => onToggleSelect(vendor.id)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                  />
                </td>

                {/* VENDOR INFO */}
                <td className="px-6 py-4 align-middle">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900">{vendor.company_name}</span>
                    <span className="text-xs text-slate-500 font-mono">{vendor.contact_email}</span>
                  </div>
                </td>
                
                {/* RISK BADGE */}
                <td className="px-6 py-4 align-middle relative">
                  <div className="group/tooltip inline-block">
                    <button 
                      // Only allow clicking if verified (to run analysis) OR if premium
                      onClick={() => isVerified ? onAnalyze(vendor.id) : null}
                      className={`focus:outline-none ${isVerified ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      {vendor.risk_status === 'HIGH' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100 hover:bg-red-100 transition-colors">
                          <AlertTriangle className="w-3 h-3 mr-1.5" /> High Risk
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-colors">
                          Low Risk
                        </span>
                      )}
                    </button>
                    
                    {/* Tooltip Logic */}
                    <div className="absolute left-0 bottom-full mb-2 w-80 bg-slate-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-all pointer-events-none z-50 p-4">
                      {isPremium ? (
                        <div>
                           <p className="font-bold text-slate-200 mb-2 border-b border-slate-700 pb-2">
                             Risk Factor: {vendor.country}
                           </p>
                           
                           {/* AI Summary Preview */}
                           {vendor.ai_risk_summary ? (
                             <div className="mb-2">
                               <p className="font-semibold text-purple-300 mb-1">AI Analysis:</p>
                               <p className="text-slate-300 line-clamp-3 italic">
                                 "{vendor.ai_risk_summary}"
                               </p>
                             </div>
                           ) : (
                             <p className="text-slate-400 italic mb-2">No AI analysis run yet.</p>
                           )}

                           {isVerified ? (
                             <div className="flex items-center gap-2 text-green-400 font-bold mt-2 bg-slate-800 p-2 rounded">
                               <Wand size={14} /> Click to view full report
                             </div>
                           ) : (
                             <p className="text-amber-400 mt-2">Waiting for evidence upload.</p>
                           )}
                        </div>
                      ) : (
                        <div className="flex gap-2 items-start">
                          <Lock size={14} className="text-amber-400 mt-0.5 shrink-0"/>
                          <p>Upgrade to see detailed risk factors (Country, Industry) and AI remediation advice.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* STATUS */}
                <td className="px-6 py-4 align-middle">
                  <StatusBadge status={vendor.verification_status} />
                </td>

                {/* ACTIONS */}
                <td className="px-6 py-4 text-right align-middle">
                  <div className="flex justify-end items-center gap-2">
                    
                    {/* NEW: ANALYZE BUTTON (Only if Verified) */}
                    {isVerified && (
                      <button 
                        onClick={() => onAnalyze(vendor.id)}
                        className="text-purple-600 hover:text-purple-800 text-xs font-bold flex items-center gap-1 transition-colors bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-md border border-purple-100"
                        title="Run AI Analysis"
                      >
                        <Wand className="w-3 h-3" /> Analyze
                      </button>
                    )}

                    {/* SCENARIO 1: NEW VENDOR */}
                    {vendor.verification_status === 'PENDING' && (
                       <button 
                          onClick={isPremium ? () => onSendSingle(vendor.id) : onTriggerUpsell}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md text-xs font-bold transition-colors"
                       >
                          {isPremium ? <Send size={12}/> : <Lock size={12}/>}
                          Verify
                       </button>
                    )}

                    {/* SCENARIO 2: ALREADY SENT */}
                    {vendor.verification_status === 'SENT' && (
                       <button 
                          onClick={isPremium ? () => onSendSingle(vendor.id) : onTriggerUpsell}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-md text-xs font-bold transition-colors"
                       >
                          {isPremium ? <BellRing size={12}/> : <Lock size={12}/>}
                          Remind
                       </button>
                    )}
                    
                    {/* SCENARIO 3: VERIFIED (View Evidence) */}
                    {isVerified && (
                      <button 
                        onClick={() => onViewCert(vendor.id)}
                        className="text-green-600 hover:text-green-800 text-xs font-bold flex items-center gap-1 transition-colors bg-green-50 px-3 py-1.5 rounded-md border border-green-100"
                      >
                        <FileText className="w-3 h-3" /> Cert
                      </button>
                    )}
                    
                    {/* History & Delete */}
                    <button 
                      onClick={() => onViewHistory(vendor.id)}
                      className="text-slate-400 hover:text-blue-600 transition-colors p-1.5 rounded-md hover:bg-slate-100"
                      title="View History"
                    >
                      <History size={16} />
                    </button>

                    <button 
                      onClick={() => onDelete(vendor.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1.5 rounded-md hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'VERIFIED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wide font-bold bg-green-50 text-green-700 border border-green-200">
        <CheckCircle className="w-3 h-3" /> Answered
      </span>
    );
  }
  if (status === 'SENT') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wide font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3 h-3" /> Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wide font-bold bg-slate-100 text-slate-500 border border-slate-200">
      Draft
    </span>
  );
}