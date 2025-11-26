import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { useAuditStore } from '@/lib/store';
import { PaywallModal } from '@/components/PaywallModal';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { DashboardActions } from '@/components/dashboard/DashboardActions';
import { VendorTable } from '@/components/dashboard/VendorTable';
import { generateS211Report } from '@/lib/pdf-generator'; // Ensure this is imported

// Define the shape of our data matching Supabase
interface Vendor {
  id: string;
  company_name: string;
  contact_email: string;
  country: string;
  risk_status: 'HIGH' | 'LOW';
  verification_status: 'PENDING' | 'SENT' | 'VERIFIED';
  magic_token: string;
}

export function Dashboard() {
  // --- STATE MANAGEMENT ---
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // Manual Add Form State
  const [newVendor, setNewVendor] = useState({ name: '', email: '', country: '' });

  // Global Store
  const isPremium = useAuditStore((state) => state.isPremium);

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching vendors:', error);
    if (data) setVendors(data as Vendor[]);
    setLoading(false);
  };

  // --- LOGIC: CSV IMPORT ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const text = await file.text();
      const rows = text.split('\n');
      const newVendors = [];

      // Get current user to attach to vendor
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("User not authenticated");

      // Skip header row (index 0)
      for (const row of rows.slice(1)) {
        // Handle simple CSV splitting (robust for basic files)
        const [name, email, country] = row.split(',').map(s => s?.trim());

        if (!name) continue;

        // Auto-Risk Logic (The "Value Add")
        const isHigh = ['India', 'China', 'Vietnam', 'Bangladesh', 'Pakistan', 'Myanmar', 'Cambodia', 'Russia'].some(r =>
          country?.toLowerCase().includes(r.toLowerCase())
        );

        newVendors.push({
          user_id: user.id,
          company_name: name,
          contact_email: email || 'pending@input.com',
          country: country || 'Unknown',
          risk_status: isHigh ? 'HIGH' : 'LOW',
          verification_status: 'PENDING'
        });
      }

      if (newVendors.length > 0) {
        const { error } = await supabase.from('vendors').insert(newVendors);
        if (error) throw error;
        await fetchVendors();
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload CSV. Please ensure it matches the template.");
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input so same file can be selected again
    }
  };

  // --- LOGIC: SEND CAMPAIGN (GATED) ---
  const handleSendCampaign = async () => {
    // 1. The Gatekeeper Check
    if (!isPremium) {
      setShowPaywall(true);
      return;
    }

    const targets = vendors.filter(v => selectedIds.has(v.id));
    if (targets.length === 0) return;

    // 2. The Mock Campaign Dispatch (Replace with Edge Function in Prod)
    for (const vendor of targets) {
      console.log(`[Server Action] Sending compliance email to ${vendor.contact_email}`);

      // Audit Log Entry
      await supabase.from('compliance_logs').insert({
        vendor_id: vendor.id,
        action_type: 'EMAIL_SENT',
        details: `Compliance request sent to ${vendor.contact_email}`
      });

      // Update Vendor Status
      await supabase.from('vendors').update({ verification_status: 'SENT' }).eq('id', vendor.id);
    }

    alert(`Success! Compliance requests sent to ${targets.length} vendors.`);
    await fetchVendors();
    setSelectedIds(new Set()); // Clear selection
  };

  // --- LOGIC: SINGLE SEND (GATED) ---
  const handleSingleSend = async (id: string) => {
    if (!isPremium) {
      setShowPaywall(true);
      return;
    }

    const vendor = vendors.find(v => v.id === id);
    if (!vendor) return;

    console.log(`[Server Action] Sending single email to ${vendor.contact_email}`);

    // Audit Log Entry
    await supabase.from('compliance_logs').insert({
      vendor_id: id,
      action_type: 'EMAIL_SENT',
      details: `Manual single request sent to ${vendor.contact_email}`
    });

    // Update Vendor Status
    await supabase.from('vendors').update({ verification_status: 'SENT' }).eq('id', id);
    
    alert(`Request sent to ${vendor.company_name}`);
    fetchVendors();
  };

  // --- LOGIC: GENERATE REPORT (GATED) ---
  const handleGenerateReport = async () => {
    if (!isPremium) {
      setShowPaywall(true);
      return;
    }
    
    // Fetch Logs for the report
    const { data: logs } = await supabase.from('compliance_logs').select('*').order('timestamp', { ascending: false });
    
    // Generate PDF
    if (generateS211Report) {
        generateS211Report("My Company Inc.", vendors, logs || []);
    } else {
        alert("PDF Generator not implemented yet.");
    }
  };

  // --- LOGIC: MANUAL ADD ---
  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Auto-calc risk
    const isHigh = ['India', 'China', 'Vietnam', 'Russia'].some(r =>
      newVendor.country.toLowerCase().includes(r.toLowerCase())
    );

    const { error } = await supabase.from('vendors').insert({
      user_id: user.id,
      company_name: newVendor.name,
      contact_email: newVendor.email,
      country: newVendor.country,
      risk_status: isHigh ? 'HIGH' : 'LOW',
      verification_status: 'PENDING'
    });

    if (!error) {
      setIsAddModalOpen(false);
      setNewVendor({ name: '', email: '', country: '' }); // Reset form
      fetchVendors();
    }
  };

  // --- LOGIC: DELETE VENDOR ---
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this vendor from monitoring?')) return;

    const { error } = await supabase.from('vendors').delete().eq('id', id);

    if (!error) {
      setVendors(prev => prev.filter(v => v.id !== id));
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // --- HELPER: DOWNLOAD TEMPLATE ---
  const handleDownloadTemplate = () => {
    const content = "data:text/csv;charset=utf-8,Company Name,Email Address,Country\nAcme Corp,contact@acme.com,Canada\nTextiles Ltd,sales@textiles.in,India";
    const encodedUri = encodeURI(content);
    window.open(encodedUri);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* 1. ACTION BAR */}
        <DashboardActions
           onManualAdd={() => setIsAddModalOpen(true)}
           onFileUpload={handleFileUpload}
           onVerify={handleSendCampaign}
           onGenerateReport={handleGenerateReport}
           onDownloadTemplate={handleDownloadTemplate}
           uploading={uploading}
           selectedCount={selectedIds.size}
           isPremium={isPremium}
        />

        {/* 2. STATISTICS */}
        <DashboardStats
          total={vendors.length}
          highRisk={vendors.filter(v => v.risk_status === 'HIGH').length}
          verified={vendors.filter(v => v.verification_status === 'VERIFIED').length}
        />

        {/* 3. MAIN TABLE */}
        <VendorTable
          vendors={vendors}
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
          onSendSingle={handleSingleSend}
        />

      </main>

      {/* --- MODAL: ADD VENDOR --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 relative transform scale-100">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20}/>
              </button>

              <h2 className="text-2xl font-bold text-slate-900 mb-6">Add New Vendor</h2>

              <form onSubmit={handleManualAdd} className="space-y-5">
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Company Name</label>
                   <input
                     className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                     value={newVendor.name}
                     onChange={e => setNewVendor({...newVendor, name: e.target.value})}
                     placeholder="e.g. Acme Inc."
                     required
                   />
                 </div>

                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Contact Email</label>
                   <input
                     type="email"
                     className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                     value={newVendor.email}
                     onChange={e => setNewVendor({...newVendor, email: e.target.value})}
                     placeholder="contact@vendor.com"
                     required
                   />
                 </div>

                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Country</label>
                   <input
                     className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                     value={newVendor.country}
                     onChange={e => setNewVendor({...newVendor, country: e.target.value})}
                     placeholder="e.g. China"
                     required
                   />
                   <p className="text-xs text-slate-400 mt-1.5">We use this to auto-calculate risk scores.</p>
                 </div>

                 <button
                   type="submit"
                   className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 mt-2"
                 >
                    Save Vendor
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* --- MODAL: PAYWALL --- */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </div>
  );
}

export default Dashboard;