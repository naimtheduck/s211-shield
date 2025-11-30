import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Header } from '../components/Header';
import { useAuditStore } from '../lib/store';
import { PaywallModal } from '../components/PaywallModal';
import { DashboardStats } from '../components/dashboard/DashboardStats';
import { DashboardActions } from '../components/dashboard/DashboardActions';
import { VendorTable } from '../components/dashboard/VendorTable';
import { CsvImportWizard } from '../components/dashboard/CsvImportWizard';
import { CampaignReviewModal } from '../components/dashboard/CampaignReviewModal'; // Ensure this exists
import { HistoryDrawer } from '../components/dashboard/HistoryDrawer'; // Ensure this exists
import { ReportBuilderModal } from '../components/dashboard/ReportBuilderModal'; // Ensure this exists
import { generateS211Report } from '../lib/pdf-generator';
import { toast } from 'sonner';

interface DashboardVendor {
  id: string;
  vendor: {
    company_name: string;
    contact_email: string;
    country: string;
  };
  risk_status: 'HIGH' | 'LOW';
  verification_status: 'PENDING' | 'SENT' | 'VERIFIED';
}

export function Dashboard() {
  const [vendors, setVendors] = useState<DashboardVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  
  // Campaign Review States
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<'batch' | string>('batch');

  // History Drawer States
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyVendorId, setHistoryVendorId] = useState<string | null>(null);

  // Report Builder State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Data States
  const [cycleId, setCycleId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>('My Company');
  const [newVendor, setNewVendor] = useState({ name: '', email: '', country: '' });

  const isPremium = useAuditStore((state) => state.isPremium);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. GATEKEEPER
    const { data: member, error: memberError } = await supabase
      .from('organization_members')
      .select('company_id, role, company:companies ( name, subscription_status )')
      .eq('user_id', user.id)
      .maybeSingle();

    if (memberError) {
      console.error("Critical Database Error:", memberError);
      alert("Database permission error. Please ensure the RLS fix script was run.");
      setLoading(false);
      return;
    }

    if (!member) {
      console.log("No membership found - redirecting to onboarding");
      window.location.href = '/onboarding';
      return;
    }

    if (member.company?.name) {
        setCompanyName(member.company.name);
    }

    const isCompanyPremium = member.company?.subscription_status === 'premium';
    useAuditStore.setState({ isPremium: isCompanyPremium });

    // 2. Reporting Cycle
    const { data: cycle, error: cycleError } = await supabase
      .from('reporting_cycles')
      .select('id')
      .eq('company_id', member.company_id)
      .eq('is_active', true)
      .maybeSingle();

    let activeCycleId = cycle?.id;

    if (!activeCycleId) {
      const { data: newCycle, error: createError } = await supabase
        .from('reporting_cycles')
        .insert({
          company_id: member.company_id,
          year: new Date().getFullYear(),
          name: `${new Date().getFullYear()} Compliance Report`,
          is_active: true
        })
        .select()
        .single();

      if (createError) {
        setLoading(false);
        return;
      }
      activeCycleId = newCycle.id;
    }

    // 3. Load Data
    if (activeCycleId) {
        setCycleId(activeCycleId);
        await loadVendors(activeCycleId);
    }
    
    setLoading(false);
  };

  const loadVendors = async (id: string) => {
    const { data, error } = await supabase
      .from('company_vendors')
      .select(`
        id,
        risk_status,
        verification_status,
        vendor:vendors ( company_name, contact_email, country )
      `)
      .eq('reporting_cycle_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch vendors error:', error);
    } else if (data) {
      setVendors(data as any[]);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycleId) return;

    const { data: vendor, error: vErr } = await supabase
      .from('vendors')
      .insert({
        company_name: newVendor.name,
        contact_email: newVendor.email,
        country: newVendor.country
      })
      .select()
      .single();

    if (vErr) { alert(`Error creating vendor: ${vErr.message}`); return; }

    const isHigh = ['India', 'China', 'Vietnam', 'Russia', 'Myanmar', 'North Korea'].some(r => 
      newVendor.country.toLowerCase().includes(r.toLowerCase())
    );

    const { error: lErr } = await supabase.from('company_vendors').insert({
      reporting_cycle_id: cycleId,
      vendor_id: vendor.id,
      risk_status: isHigh ? 'HIGH' : 'LOW',
      verification_status: 'PENDING'
    });

    if (!lErr) {
      setIsAddModalOpen(false);
      setNewVendor({ name: '', email: '', country: '' });
      fetchDashboardData();
      toast.success("Vendor added successfully");
    } else {
        toast.error(`Link Error: ${lErr.message}`);
    }
  };

  const handleGenerateReport = () => {
    if (!isPremium) { 
        setShowPaywall(true); 
        return; 
    }
    // Open the Builder Modal instead of downloading immediately
    setIsReportModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove vendor from this report?')) return;
    const { error } = await supabase.from('company_vendors').delete().eq('id', id);
    if (!error) {
        setVendors(prev => prev.filter(v => v.id !== id));
    }
  };

  // --- Campaign Handlers ---

  const handleBatchVerifyClick = () => {
    if (!isPremium) { setShowPaywall(true); return; }
    if (selectedIds.size === 0) return;
    setReviewTarget('batch');
    setIsReviewModalOpen(true);
  };

  const handleSingleVerifyClick = (id: string) => {
    if (!isPremium) { setShowPaywall(true); return; }
    setReviewTarget(id);
    setIsReviewModalOpen(true);
  };

  const executeCampaign = async (subject: string, body: string) => {
    console.log("🚀 Executing Campaign:", { subject, body });
    
    let targets: string[] = [];
    if (reviewTarget === 'batch') {
      targets = Array.from(selectedIds);
    } else {
      targets = [reviewTarget];
    }

    try {
      toast.loading("Sending campaign...");

      // Call your Supabase Edge Function
      const { error } = await supabase.functions.invoke('send-campaign', {
        body: { ids: targets, subject, body }
      });

      if (error) throw error;

      toast.dismiss();
      toast.success(`Campaign sent to ${targets.length} vendors!`);
      
      // Optimistic UI Update
      setVendors(prev => prev.map(v => 
        targets.includes(v.id) 
          ? { ...v, verification_status: 'SENT' } 
          : v
      ));
      
      if (reviewTarget === 'batch') setSelectedIds(new Set());

    } catch (err: any) {
      toast.dismiss();
      toast.error("Failed to send campaign: " + err.message);
    }
  };

  const sendTestEmail = async (subject: string, body: string) => {
    try {
      toast.info("Sending test request...");
      
      const { data, error } = await supabase.functions.invoke('send-campaign', {
        body: { 
          test_mode: true, 
          subject, 
          body 
        }
      });

      if (error) throw error;
      
      toast.success("Test email sent! Check your inbox.");
    } catch (err: any) {
      console.error("Test Email Error:", err);
      toast.error("Test failed: " + err.message);
    }
  };

  // --- History Handler ---
  const handleViewHistory = (id: string) => {
    setHistoryVendorId(id);
    setIsHistoryOpen(true);
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <DashboardActions
           onManualAdd={() => setIsAddModalOpen(true)}
           onImportClick={() => setIsImportOpen(true)}
           onVerify={handleBatchVerifyClick}
           onGenerateReport={handleGenerateReport}
           onDownloadTemplate={() => {}}
           uploading={false}
           selectedCount={selectedIds.size}
           isPremium={isPremium}
        />

        <DashboardStats
          total={vendors.length}
          highRisk={vendors.filter(v => v.risk_status === 'HIGH').length}
          verified={vendors.filter(v => v.verification_status === 'VERIFIED').length}
        />

        <VendorTable
          vendors={vendors.map(v => ({
            id: v.id,
            company_name: v.vendor?.company_name || 'Unknown',
            contact_email: v.vendor?.contact_email || 'No Email',
            country: v.vendor?.country || 'Unknown',
            risk_status: v.risk_status,
            verification_status: v.verification_status
          }))}
          selectedIds={selectedIds}
          onToggleSelect={(id) => {
             const newSet = new Set(selectedIds);
             if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
             setSelectedIds(newSet);
          }}
          onToggleAll={(checked) => {
             if (checked) setSelectedIds(new Set(vendors.map(v => v.id)));
             else setSelectedIds(new Set());
          }}
          onDelete={handleDelete}
          onTriggerUpsell={() => setShowPaywall(true)}
          onSendSingle={handleSingleVerifyClick}
          onViewHistory={handleViewHistory}
        />
      </main>

      {/* Manual Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 relative">
              <button onClick={() => setIsAddModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Add New Vendor</h2>
              <form onSubmit={handleManualAdd} className="space-y-5">
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Company Name</label>
                   <input className="w-full p-3 border border-slate-300 rounded-lg" value={newVendor.name} onChange={e => setNewVendor({...newVendor, name: e.target.value})} required />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Contact Email</label>
                   <input type="email" className="w-full p-3 border border-slate-300 rounded-lg" value={newVendor.email} onChange={e => setNewVendor({...newVendor, email: e.target.value})} required />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Country</label>
                   <input className="w-full p-3 border border-slate-300 rounded-lg" value={newVendor.country} onChange={e => setNewVendor({...newVendor, country: e.target.value})} required />
                 </div>
                 <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-lg hover:bg-slate-800 mt-2">Save Vendor</button>
              </form>
           </div>
        </div>
      )}

      <CsvImportWizard 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        onSuccess={() => fetchDashboardData()}
        cycleId={cycleId} 
      />

      <CampaignReviewModal 
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSend={executeCampaign}
        onTest={sendTestEmail}
        recipientCount={reviewTarget === 'batch' ? selectedIds.size : 1}
        recipientLabel={
          reviewTarget === 'batch' 
            ? `${selectedIds.size} selected vendors`
            : vendors.find(v => v.id === reviewTarget)?.vendor?.company_name || 'Vendor'
        }
      />

      <HistoryDrawer 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        companyVendorId={historyVendorId} 
      />

      {/* --- REPORT BUILDER MODAL --- */}
      <ReportBuilderModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        cycleId={cycleId}
        companyName={companyName}
        vendors={vendors}
      />

      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  );
}