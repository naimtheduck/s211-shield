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
import { Loader2 } from 'lucide-react'; 

function App() {
  const path = useRouter();
  const setIsLoggedIn = useAuditStore((state) => state.setIsLoggedIn);
  const isLoggedIn = useAuditStore((state) => state.isLoggedIn);
  const [loading, setLoading] = useState(true);

// Inside your App.tsx — replace the whole useEffect and getContent()

useEffect(() => {
  const checkSession = async () => {
    setLoading(true); // ← must be first!

    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session);

    // Handle pending invite (highest priority)
    const pendingToken = sessionStorage.getItem('pending_invite_token');
    if (pendingToken && session) {
      sessionStorage.removeItem('pending_invite_token');
      window.location.href = `/join?token=${pendingToken}`;
      return;
    }

    // Only if logged in → check company membership
    if (session) {
      const { data: member } = await supabase
        .from('organization_members')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      const currentPath = window.location.pathname;

      // HAS company → force dashboard (unless already there)
      if (member && !currentPath.startsWith('/dashboard') && currentPath !== '/team') {
        window.location.href = '/dashboard';
        return;
      }

      // NO company → force onboarding (unless already there)
      if (!member && currentPath !== '/onboarding') {
        window.location.href = '/onboarding';
        return;
      }
    }

    setLoading(false);
  };

  checkSession();

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    setIsLoggedIn(!!session);
    // Re-run the full check on any auth change
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'SIGNED_OUT') {
      checkSession();
    }
  });

  return () => subscription.unsubscribe();
}, [setIsLoggedIn]);

const getContent = () => {
  if (path.startsWith('/join')) return <AcceptInvite />;
  if (path.startsWith('/verify')) {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    return <SupplierPortal token={token || ''} />;
  }
  if (path === '/privacy-policy') return <PrivacyPolicy />;
  if (path === '/terms-of-service') return <TermsOfService />;

  if (isLoggedIn) {
    if (path.startsWith('/dashboard')) return <Dashboard />;
    if (path === '/onboarding') return <Onboarding />;
    if (path === '/team') return <TeamSettings />;
    
    // Fallback
    return <Dashboard />;
  }

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