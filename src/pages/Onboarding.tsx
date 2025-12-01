// src/pages/Onboarding.tsx
import { useState } from 'react';
import { Building2, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Header } from '../components/Header';

export function Onboarding() {
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState('');

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    try {
      const { data: company } = await supabase
        .from('companies')
        .insert({ name: companyName, owner_id: user!.id })
        .select()
        .single();

      await supabase
        .from('organization_members')
        .insert({
          company_id: company.id,
          user_id: user!.id,
          role: 'owner'
        });

      await supabase
        .from('reporting_cycles')
        .insert({
          company_id: company.id,
          year: new Date().getFullYear(),
          name: `${new Date().getFullYear()} Compliance Report`,
          is_active: true
        });

      // Clean redirect
      window.location.href = '/dashboard';
    } catch (err: any) {
      alert(`Setup failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

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
              {loading ? (
                <>Creating... <Loader2 size={16} className="animate-spin" /></>
              ) : (
                <>Create Workspace <ArrowRight size={16} /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}