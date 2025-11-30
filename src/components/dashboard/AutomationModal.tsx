import { useState, useEffect } from 'react';
import { X, Zap, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface AutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AutomationModal({ isOpen, onClose }: AutomationModalProps) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) fetchSettings();
  }, [isOpen]);

  const fetchSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Get Company ID for user
    const { data: member } = await supabase
      .from('organization_members')
      .select('company:companies(auto_remind_enabled)')
      .eq('user_id', user.id)
      .single();

    if (member?.company) {
      // @ts-ignore
      setEnabled(member.company.auto_remind_enabled);
    }
    setLoading(false);
  };

  const handleToggle = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    // Ideally fetch company_id properly, simpler for MVP:
    const { data: member } = await supabase
      .from('organization_members')
      .select('company_id')
      .eq('user_id', user!.id)
      .single();

    const { error } = await supabase
      .from('companies')
      .update({ auto_remind_enabled: !enabled })
      .eq('id', member?.company_id);

    if (error) {
      toast.error("Failed to update settings");
    } else {
      setEnabled(!enabled);
      toast.success(!enabled ? "Automation Activated" : "Automation Paused");
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" /> Automation Pilot
          </h2>
          <button onClick={onClose}><X className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        
        <div className="p-8 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors ${enabled ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-400'}`}>
            {enabled ? <Clock size={40} /> : <Zap size={40} />}
          </div>
          
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {enabled ? "Auto-Chaser Active" : "Automation Paused"}
          </h3>
          <p className="text-slate-500 mb-8 text-sm leading-relaxed">
            When active, we will automatically send weekly reminders to any vendor who has not yet submitted their evidence.
          </p>

          <button
            onClick={handleToggle}
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg ${enabled ? 'bg-slate-900 hover:bg-slate-800' : 'bg-purple-600 hover:bg-purple-700'}`}
          >
            {enabled ? "Turn Off Automation" : "Activate Auto-Chaser"}
          </button>
        </div>
        
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
            <AlertCircle size={12}/> Frequency: Every Monday at 9:00 AM EST
          </p>
        </div>
      </div>
    </div>
  );
}