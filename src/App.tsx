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
  const checkSessionAndMembership = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setIsLoggedIn(!!session);
    setLoading(true); // keep loading until we know where to go

    if (!session) {
      setLoading(false);
      return;
    }

    // Handle pending invite first (highest priority)
    const pendingToken = sessionStorage.getItem('pending_invite_token');
    if (pendingToken) {
      sessionStorage.removeItem('pending_invite_token');
      window.location.href = `/join?token=${pendingToken}`;
      return;
    }

    // Critical: Check if user already belongs to a company
    const { data: member, error } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (error) {
      console.error('Error checking membership:', error);
    }

    // Save this globally if you want (optional)
    // useAuditStore.getState().setHasCompany(!!member);

    setLoading(false);

    // Auto-redirect based on membership
    const currentPath = window.location.pathname;
    const isOnOnboarding = currentPath === '/onboarding';
    const isOnDashboard = currentPath.startsWith('/dashboard');
    const isOnTeam = currentPath === '/team';

    if (member) {
      // User HAS company → send to dashboard unless already there
      if (!isOnDashboard && !isOnTeam) {
        window.location.href = '/dashboard';
      }
    } else {
      // User has NO company → force onboarding unless already there
      if (!isOnOnboarding) {
        window.location.href = '/onboarding';
      }
    }
  };

  checkSessionAndMembership();

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    setIsLoggedIn(!!session);
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      checkSessionAndMembership();
    }
    if (event === 'SIGNED_OUT') {
      setLoading(false);
    }
  });

  return () => subscription.unsubscribe();
}, [setIsLoggedIn]);

const getContent = () => {
  // Priority public/hybrid routes
  if (path.startsWith('/join')) return <AcceptInvite />;
  if (path.startsWith('/verify')) {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    return <SupplierPortal token={token || ''} />;
  }
  if (path === '/privacy-policy') return <PrivacyPolicy />;
  if (path === '/terms-of-service') return <TermsOfService />;

  // Protected routes — we trust the redirect above already sent user to right place
  if (isLoggedIn) {
    if (path.startsWith('/dashboard')) return <Dashboard />;
    if (path === '/onboarding') return <Onboarding />;
    if (path === '/team') return <TeamSettings />;
    
    // Fallback (should rarely hit due to redirect above)
    return <Dashboard />;
  }

  // Not logged in → Landing
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