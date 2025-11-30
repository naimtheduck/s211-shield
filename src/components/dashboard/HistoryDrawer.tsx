import { useEffect, useState } from 'react';
import { X, FileText, Clock, Download, Loader2, Paperclip, MessageSquare, CheckCircle, Mail, Eye, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  companyVendorId: string | null;
}

interface LogEntry {
  id: string;
  action_type: string;
  details: string | null;
  timestamp: string;
}

interface EvidenceFile {
  path: string;
  uploaded_at: string;
}

interface RequestEntry {
  id: string;
  status: string;
  created_at: string;
  evidence_files: EvidenceFile[] | null;
}

interface TimelineEvent {
  id: string;
  type: string;
  timestamp: string;
  title: string;
  details: string | null;
  icon: any;
  colorClass: string;
}

export function HistoryDrawer({ isOpen, onClose, companyVendorId }: HistoryDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [requests, setRequests] = useState<RequestEntry[]>([]);

  useEffect(() => {
    if (isOpen && companyVendorId) {
      fetchHistory();
    }
  }, [isOpen, companyVendorId]);

  const fetchHistory = async () => {
    if (!companyVendorId) return;
    setLoading(true);

    try {
      const { data: cv } = await supabase
        .from('company_vendors')
        .select('vendor:vendors(company_name)')
        .eq('id', companyVendorId)
        .single();
      
      // @ts-ignore
      if (cv?.vendor) setVendorName(cv.vendor.company_name);

      const { data: logData } = await supabase
        .from('compliance_logs')
        .select('*')
        .eq('company_vendor_id', companyVendorId)
        .order('timestamp', { ascending: false });
      setLogs(logData || []);

      const { data: reqData } = await supabase
        .from('supplier_requests')
        .select('*')
        .eq('company_vendor_id', companyVendorId)
        .order('created_at', { ascending: false });
      setRequests(reqData || []);

    } catch (err) {
      console.error(err);
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (path: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('compliance-docs')
        .createSignedUrl(path, 60);

      if (error) throw error;
      if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    } catch (err) {
      toast.error('Could not access file.');
    }
  };

  const getTimeline = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    requests.forEach(req => {
      events.push({
        id: `req-${req.id}`,
        type: 'REQUEST_SENT',
        timestamp: req.created_at,
        title: 'Compliance Request Sent',
        details: 'Verification email dispatched to vendor contact.',
        icon: Mail,
        colorClass: 'bg-blue-100 text-blue-600 border-blue-200'
      });
    });

    logs.forEach(log => {
      let title = log.action_type.replace(/_/g, ' ');
      let icon = Clock;
      let colorClass = 'bg-gray-100 text-gray-500 border-gray-200';

      if (log.action_type === 'VENDOR_VIEWED') {
        title = 'Vendor Viewed Request';
        icon = Eye;
        colorClass = 'bg-amber-100 text-amber-600 border-amber-200';
      } else if (log.action_type === 'VENDOR_SUBMITTED') {
        title = 'Response Submitted';
        icon = ShieldCheck;
        colorClass = 'bg-green-100 text-green-600 border-green-200';
      }

      events.push({
        id: `log-${log.id}`,
        type: log.action_type,
        timestamp: log.timestamp,
        title: title,
        details: log.details,
        icon: icon,
        colorClass: colorClass
      });
    });

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const timeline = getTimeline();

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-gray-100 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Audit History</h2>
            <p className="text-sm text-gray-500 mt-0.5">{loading ? 'Loading...' : `Timeline for ${vendorName}`}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {loading ? (
            <div className="flex justify-center items-center h-40"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
          ) : (
            <>
              {requests.some(r => r.evidence_files && r.evidence_files.length > 0) && (
                <div className="mb-8">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Paperclip size={12} /> Evidence Locker
                  </h3>
                  <div className="space-y-3">
                    {requests.map(req => (
                      req.evidence_files && req.evidence_files.length > 0 && (
                        <div key={req.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-bold text-slate-700">Verified Submission</span>
                            <span className="text-xs text-slate-400 ml-auto">{new Date(req.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="space-y-2">
                            {req.evidence_files.map((file, idx) => (
                              <button 
                                key={idx}
                                onClick={() => handleDownload(file.path)}
                                className="w-full flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all group"
                              >
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <FileText size={14} className="text-slate-400 group-hover:text-blue-500" />
                                  <span className="text-xs font-medium text-slate-600 truncate max-w-[200px] group-hover:text-blue-700">
                                    {file.path.split('_').slice(1).join('_') || file.path.split('_').pop()}
                                  </span>
                                </div>
                                <Download size={14} className="text-slate-300 group-hover:text-blue-600" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Clock size={12} /> Audit Trail
                </h3>
                {timeline.length === 0 ? (
                  <p className="text-sm text-slate-400 italic text-center py-4">No activity recorded yet.</p>
                ) : (
                  <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pb-4">
                    {timeline.map((event) => (
                      <div key={event.id} className="ml-8 relative group">
                        <div className={`absolute -left-[43px] top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${event.colorClass} bg-white z-10`}>
                          <event.icon size={14} />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-bold text-slate-800">{event.title}</span>
                            <span className="text-[12px] text-slate-400 font-mono mt-0.5">
                              {new Date(event.timestamp).toLocaleDateString()} {new Date(event.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          {event.details && (
                            <div className="mt-2 text-sm text-slate-600">
                              {event.details.includes("Note:") ? (
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-1">
                                  <span className="block mb-1 text-slate-500">{event.details.split("Note:")[0]}</span>
                                  <div className="flex gap-2 items-start text-blue-800 bg-blue-50/50 p-2 rounded">
                                      <MessageSquare size={14} className="mt-0.5 shrink-0 opacity-50"/> 
                                      <span className="italic">"{event.details.split("Note:")[1].replace(/"/g, '').trim()}"</span>
                                  </div>
                                </div>
                              ) : (
                                <p>{event.details}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}