import { useEffect, useState } from 'react';
import { useRouter } from './lib/router';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { SupplierPortal } from './pages/SupplierPortal'; 
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { useAuditStore } from './lib/store';
import { supabase } from './lib/supabase';

function App() {
  const path = useRouter();
  const setIsLoggedIn = useAuditStore((state) => state.setIsLoggedIn);
  const isLoggedIn = useAuditStore((state) => state.isLoggedIn);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check Active Session on Load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      setLoading(false);
    });

    // 2. Listen for Auth Changes (Sign In / Sign Out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, [setIsLoggedIn]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  // --- ROUTING LOGIC ---

  // 1. Public Vendor Portal (No Auth Required)
  // Matches /verify?token=xyz
  if (path.startsWith('/verify')) {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    return <SupplierPortal token={token || ''} />;
  }

  // 2. Static Pages
  if (path === '/privacy-policy') return <PrivacyPolicy />;
  if (path === '/terms-of-service') return <TermsOfService />;

  // 3. Protected Dashboard (CFO View)
  if (path.startsWith('/dashboard')) {
    if (!isLoggedIn) {
      // Kick them out if not logged in
      window.history.replaceState({}, '', '/');
      return <Landing />;
    }
    return <Dashboard />;
  }

  // 4. Landing / Login (Default)
  if (isLoggedIn) {
    // If already logged in, redirect to dashboard
    window.history.replaceState({}, '', '/dashboard');
    return <Dashboard />;
  }

  return <Landing />;
}

export default App;