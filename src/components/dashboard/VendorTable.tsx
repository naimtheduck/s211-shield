import { 
  AlertTriangle, CheckCircle, Clock, FileText, Trash2, 
  Lock, BellRing, Send, History 
} from 'lucide-react';
import { useAuditStore } from '../../lib/store'; // Adjusted path if needed, usually '@/lib/store' or '../lib/store' depending on your config

interface Vendor {
  id: string;
  company_name: string;
  contact_email: string;
  country: string;
  risk_status: 'HIGH' | 'LOW';
  verification_status: 'PENDING' | 'SENT' | 'VERIFIED';
}

interface VendorTableProps {
  vendors: Vendor[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleAll: (selected: boolean) => void;
  onDelete: (id: string) => void;
  onTriggerUpsell: () => void;
  onSendSingle: (id: string) => void;
  onViewHistory: (id: string) => void; // <--- NEW PROP
}

export function VendorTable({ 
  vendors, 
  selectedIds, 
  onToggleSelect, 
  onToggleAll,
  onDelete, 
  onTriggerUpsell,
  onSendSingle,
  onViewHistory
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
          ) : vendors.map((vendor) => (
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
                  {vendor.risk_status === 'HIGH' ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100 cursor-help">
                      <AlertTriangle className="w-3 h-3 mr-1.5" /> High Risk
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 cursor-default">
                      Low Risk
                    </span>
                  )}
                  {/* Tooltip Logic */}
                  <div className="absolute left-0 bottom-full mb-2 w-72 bg-slate-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-all pointer-events-none z-50 p-3">
                    {isPremium ? (
                      <div>
                         <p className="font-bold text-slate-200 mb-1">Risk Factor: {vendor.country}</p>
                         <p className="text-slate-400">Recommended Action: Send S-211 Verification.</p>
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
                  
                  {/* SCENARIO 1: NEW VENDOR */}
                  {vendor.verification_status === 'PENDING' && (
                     <button 
                        onClick={isPremium ? () => onSendSingle(vendor.id) : onTriggerUpsell}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md text-xs font-bold transition-colors"
                     >
                        {isPremium ? <Send size={12}/> : <Lock size={12}/>}
                        Send Request {/* <--- RENAMED */}
                     </button>
                  )}

                  {/* SCENARIO 2: ALREADY SENT (Remind) */}
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
                  {vendor.verification_status === 'VERIFIED' && (
                    <button className="text-green-600 hover:text-green-800 text-xs font-bold flex items-center gap-1 transition-colors bg-green-50 px-3 py-1.5 rounded-md">
                      <FileText className="w-3 h-3" /> Cert
                    </button>
                  )}
                  
                  {/* History Icon */}
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
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'VERIFIED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wide font-bold bg-green-50 text-green-700 border border-green-200">
        <CheckCircle className="w-3 h-3" /> Compliant
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