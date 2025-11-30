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
  const [isImportOpen, setIsImportOpen] = useState(false); // <--- CSV Wizard State
  const [showPaywall, setShowPaywall] = useState(false);
  
  // Data States
  const [cycleId, setCycleId] = useState<string | null>(null); // <--- Stores active cycle for CSV
  const [newVendor, setNewVendor] = useState({ name: '', email: '', country: '' });
  
  const isPremium = useAuditStore((state) => state.isPremium);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. GATEKEEPER: Check Membership
    const { data: member, error: memberError } = await supabase
      .from('organization_members')
      .select('company_id, role, company:companies ( subscription_status )')
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
    const isCompanyPremium = member.company?.subscription_status === 'premium';
    useAuditStore.setState({ isPremium: isCompanyPremium });
    console.log("✅ User is member of company:", member.company_id);
    console.log("💎 Premium Status:", isCompanyPremium);
    // 2. Get Active Reporting Cycle
    // We check for the cycle ONCE here to avoid duplicate variable errors
    const { data: cycle, error: cycleError } = await supabase
      .from('reporting_cycles')
      .select('id')
      .eq('company_id', member.company_id)
      .eq('is_active', true)
      .maybeSingle();

    if (cycleError) {
      console.error("Error fetching cycle:", cycleError);
      setLoading(false);
      return;
    }

    let activeCycleId = cycle?.id;

    if (!activeCycleId) {
      // Auto-recover: Create a cycle if missing
      console.warn("⚠️ No active cycle found. Attempting auto-recovery...");
      
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
        console.error("❌ Failed to create cycle:", createError);
        alert(`Failed to create reporting cycle: ${createError.message}`);
        setLoading(false);
        return;
      }
      
      console.log("✅ Created new cycle:", newCycle.id);
      activeCycleId = newCycle.id;
    }

    // 3. Load Data using the ID
    if (activeCycleId) {
        setCycleId(activeCycleId); // Save to state for CSV Wizard
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
      .eq('reporting_cycle_id', id) // Correctly uses the cycle ID
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch vendors error:', error);
    } else if (data) {
      console.log("✅ Loaded vendors:", data.length);
      setVendors(data as any[]);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // We can reuse the cycleId from state since we fetched it on load
    if (!cycleId) {
        alert("System Error: No active reporting cycle loaded. Please refresh.");
        return;
    }

    // 1. Create Global Vendor
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

    // 2. Link to Company (using cycleId)
    const isHigh = ['India', 'China', 'Vietnam', 'Russia', 'Myanmar', 'North Korea'].some(r => 
      newVendor.country.toLowerCase().includes(r.toLowerCase())
    );

    const { error: lErr } = await supabase.from('company_vendors').insert({
      reporting_cycle_id: cycleId, // <--- USES STATE
      vendor_id: vendor.id,
      risk_status: isHigh ? 'HIGH' : 'LOW',
      verification_status: 'PENDING'
    });

    if (!lErr) {
      setIsAddModalOpen(false);
      setNewVendor({ name: '', email: '', country: '' });
      fetchDashboardData(); // Refresh list
      toast.success("Vendor added successfully");
    } else {
        toast.error(`Link Error: ${lErr.message}`);    }
  };

  const handleSendCampaign = () => isPremium ? alert("Campaign sent!") : setShowPaywall(true);
  
  const handleGenerateReport = () => {
    if (!isPremium) { setShowPaywall(true); return; }
    const flatData = vendors.map(v => ({
        id: v.id,
        company_name: v.vendor.company_name,
        contact_email: v.vendor.contact_email,
        country: v.vendor.country,
        risk_status: v.risk_status,
        verification_status: v.verification_status
    }));
    generateS211Report("My Company", flatData as any, []);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove vendor from this report?')) return;
    const { error } = await supabase.from('company_vendors').delete().eq('id', id);
    if (!error) {
        setVendors(prev => prev.filter(v => v.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mb-4"></div>
          <p className="text-slate-600 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <DashboardActions
           onManualAdd={() => setIsAddModalOpen(true)}
           onImportClick={() => setIsImportOpen(true)} // Opens Wizard
           onVerify={handleSendCampaign}
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
          // 👇 THIS IS THE FIX: Flatten the nested data structure
          vendors={vendors.map(v => ({
            id: v.id,
            company_name: v.vendor?.company_name || 'Unknown Vendor', // Safety check
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
          onSendSingle={() => {}}
        />
      </main>

      {/* MANUAL ADD MODAL */}
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

      {/* CSV WIZARD MODAL */}
      <CsvImportWizard 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        onSuccess={() => fetchDashboardData()}
        cycleId={cycleId} 
      />

      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  );
}