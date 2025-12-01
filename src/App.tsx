import { useState, useEffect } from 'react';
import { useRouter } from './lib/router';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { SupplierPortal } from './pages/SupplierPortal';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { Onboarding } from './pages/Onboarding';
import { TeamSettings } from './pages/TeamSettings';
import { AcceptInvite } from './pages/AcceptInvite';
import { useAuditStore } from './lib/store';
import { supabase } from './lib/supabase';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react'; // Need to import Loader2 for loading state

function App() {
  const path = useRouter();
  const setIsLoggedIn = useAuditStore((state) => state.setIsLoggedIn);
  const isLoggedIn = useAuditStore((state) => state.isLoggedIn);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      
      // Post-login invite redirect (if session is established after the token was saved)
      if (session) {
        const pendingToken = sessionStorage.getItem('pending_invite_token');
        if (pendingToken) {
          sessionStorage.removeItem('pending_invite_token');
          window.location.href = `/join?token=${pendingToken}`;
          return;
        }
      }
      setLoading(false);
    };

    checkSession();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
      if (event === 'SIGNED_IN' && session) {
        const pendingToken = sessionStorage.getItem('pending_invite_token');
        if (pendingToken) {
          sessionStorage.removeItem('pending_invite_token');
          window.location.href = `/join?token=${pendingToken}`;
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setIsLoggedIn]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
      </div>
    );
  }

  const getContent = () => {
    // 1. Priority Routes (Public/Hybrid)
    if (path.startsWith('/join')) {
      return <AcceptInvite />;
    }
    
    // /verify route needs the token from window.location.search
    if (path.startsWith('/verify')) {
      // Access token directly from search params, as in the original working version
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      return <SupplierPortal token={token || ''} />;
    }

    if (path === '/privacy-policy') return <PrivacyPolicy />;
    if (path === '/terms-of-service') return <TermsOfService />;
    
    // 2. Protected Routes (Logged In Users Only)
    if (isLoggedIn) {
      if (path === '/onboarding') return <Onboarding />;
      if (path === '/team') return <TeamSettings />;
      
      // Default Dashboard Route
      if (path.startsWith('/dashboard')) {
        return <Dashboard />;
      }
      
      // Default Redirect for unknown protected routes
      window.history.replaceState({}, '', '/dashboard');
      return <Dashboard />;
    }
    
    // 3. Public Landing Page
    return <Landing />;
  };

  return (
    <>
      <Toaster position="bottom-right" richColors />
      {getContent()}
    </>
  );
}

export default App;