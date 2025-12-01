import { useState, useEffect } from 'react';
import { useNavigate } from '../lib/router';
import { supabase } from '../lib/supabase';
import { Building2, ArrowRight, Loader2 } from 'lucide-react';
import { Header } from '../components/Header';
import { toast } from 'sonner'; // Assuming sonner is used for success messages

// Helper function to handle clean, loop-proof redirection (Crucial for deployed stability)
const safeRedirect = (path: string) => {
    window.history.replaceState(null, '', path);
    window.location.reload(); 
};

export function Onboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true); // New loading state for check
  const [companyName, setCompanyName] = useState('');

  // --- 1. Core Authorization Check ---
  useEffect(() => {
    async function checkMembership() {
      setChecking(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
          setChecking(false);
          return;
      }
      
      // Check for Pending Invite (Highest Priority)
      const pendingToken = sessionStorage.getItem('pending_invite_token');
      if (pendingToken) {
        sessionStorage.removeItem('pending_invite_token');
        safeRedirect(`/join?token=${pendingToken}`);
        return;
      }

      // Check for Existing Membership
      const { data: member } = await supabase
        .from('organization_members')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (member) {
        // User is already set up. Redirect immediately and cleanly.
        console.log("User already has a team. Redirecting to dashboard.");
        safeRedirect('/dashboard'); 
        return;
      }
      
      setChecking(false); // Done checking, show form
    }
    checkMembership();
  }, []);

  // --- 2. Company Creation Logic ---
  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    try {
      // 1. Create Company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({ name: companyName, owner_id: user!.id })
        .select()
        .single();

      if (companyError) throw companyError;

      // 2. Create Membership (Linking user to company)
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          company_id: company.id,
          user_id: user!.id,
          role: 'owner'
        });

      if (memberError) throw memberError;

      // 3. Create initial Reporting Cycle
      const { error: cycleError } = await supabase
        .from('reporting_cycles')
        .insert({
          company_id: company.id,
          year: new Date().getFullYear(),
          name: `${new Date().getFullYear()} Compliance Report`,
          is_active: true
        });

      if (cycleError) throw cycleError;

      // 4. Redirect (Success)
      safeRedirect('/dashboard'); 

    } catch (err: any) {
      console.error("Setup Error:", err);
      toast.error('Setup failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-slate-800" />
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-col items-center justify-center p-4 min-h-[calc(100vh-64px)]"> 
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Building2 size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome to S-211 Shield</h1>
                    <p className="text-gray-500 mt-2">Let's set up your compliance workspace.</p>
                </div>

                <form onSubmit={handleSetup} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Company Name</label>
                        <input
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="e.g. Acme Industries Inc."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                            required
                            autoFocus
                        />
                    </div>
                    <button 
                        type="submit"
                        disabled={loading || !companyName.trim()}
                        className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : <>Create Workspace <ArrowRight size={16}/></>}
                    </button>
                </form>
            </div>
        </div>
    </div>
  );
}