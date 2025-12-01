import { useState, useEffect } from 'react';
import { useNavigate } from '../lib/router';
import { supabase } from '../lib/supabase';
import { Building2, ArrowRight } from 'lucide-react';
import { Header } from '../components/Header';

export function Onboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true); // New loading state for check
  const [companyName, setCompanyName] = useState('');

    const handleCreateCompany = async (e) => {
    e.preventDefault();
    // ... [Insert company creation logic here] ...

    try {
        // [Successful API call to create company and link member]
        
        // --- CRITICAL FIX FOR REDIRECT LOOP ---
        console.log("Onboarding complete. Redirecting to Dashboard.");
        
        // Option 1 (Preferred if using React Router hooks):
        // navigate('/dashboard', { replace: true }); 
        
        // Option 2 (If using plain window.location):
        window.history.replaceState(null, '', '/dashboard');
        window.location.reload(); 
        // --------------------------------------
        
    } catch (error) {
        // ...
    }
  };

  // 1. CHECK: Do I already have a team?
  useEffect(() => {
    async function checkMembership() {
      const pendingToken = sessionStorage.getItem('pending_invite_token');
      if (pendingToken) {
        sessionStorage.removeItem('pending_invite_token');
        navigate(`/join?token=${pendingToken}`, { replace: true }); // Use replace: true
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: member } = await supabase
          .from('organization_members')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
      if (member) {
        // User is already in a team! Skip onboarding and REPLACE history entry.
        console.log("User already has a team. Redirecting to dashboard.");
        
        // CRITICAL FIX: Use navigate with replace: true to prevent loop
        // Assuming 'navigate' is available in scope.
        window.history.replaceState(null, '', '/dashboard');
        window.location.reload(); 
        return;
      }      
    }
      setChecking(false); // Done checking, show form
    }
    checkMembership();
  }, [navigate]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        setLoading(false);
        return;
    }

    try {
      // 1. Create Company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({ name: companyName, owner_id: user.id })
        .select()
        .single();

      if (companyError) throw companyError;

      // 2. Create Membership
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          company_id: company.id,
          user_id: user.id,
          role: 'owner'
        });

      if (memberError) throw memberError;

      // 3. Create Cycle
      const { error: cycleError } = await supabase
        .from('reporting_cycles')
        .insert({
          company_id: company.id,
          year: new Date().getFullYear(),
          name: `${new Date().getFullYear()} Compliance Report`,
          is_active: true
        });

      if (cycleError) throw cycleError;

      // 4. Redirect
      window.location.href = '/dashboard';

    } catch (err: any) {
      console.error("Setup Error:", err);
      alert('Setup failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
      return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
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
                        disabled={loading}
                        className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? 'Creating...' : <>Create Workspace <ArrowRight size={16}/></>}
                    </button>
                </form>
            </div>
        </div>
    </div>
  );
}