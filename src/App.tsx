import { useEffect, useState } from 'react';
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

function App() {
  const path = useRouter();
  const setIsLoggedIn = useAuditStore((state) => state.setIsLoggedIn);
  const isLoggedIn = useAuditStore((state) => state.isLoggedIn);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      
      // --- NEW: Post-Login Invite Redirect ---
      if (session) {
        const pendingToken = sessionStorage.getItem('pending_invite_token');
        if (pendingToken) {
          // We found a pending invite! Clear it and go to join page.
          sessionStorage.removeItem('pending_invite_token');
          window.location.href = `/join?token=${pendingToken}`;
          return;
        }
      }
      
      setLoading(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
      
      // Also check on sign-in event
      if (event === 'SIGNED_IN' && session) {
         const pendingToken = sessionStorage.getItem('pending_invite_token');
         if (pendingToken) {
           sessionStorage.removeItem('pending_invite_token');
           window.location.href = `/join?token=${pendingToken}`;
         }
      }
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

  // 1. Priority Routes (Public/Hybrid)
  if (path.startsWith('/join')) {
    return <AcceptInvite />;
  }

  if (path.startsWith('/verify')) {
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
    
    if (path.startsWith('/dashboard')) {
      return <Dashboard />;
    }

    // Default Redirect
    window.history.replaceState({}, '', '/dashboard');
    return <Dashboard />;
  }

  // 3. Public Landing Page
  return <Landing />;
}

export default App;