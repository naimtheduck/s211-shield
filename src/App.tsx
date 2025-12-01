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
import { Toaster } from 'sonner';

function normalizePath(raw: string) {
  // Strip query string and trailing slash
  const [pathname] = raw.split('?');
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

function App() {
  const rawPath = useRouter();
  const path = normalizePath(rawPath);

  const setIsLoggedIn = useAuditStore((state) => state.setIsLoggedIn);
  const isLoggedIn = useAuditStore((state) => state.isLoggedIn);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setIsLoggedIn(!!session);

      // Post-login invite redirect
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
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  const getContent = () => {
    // 1. Public / hybrid routes
    if (path.startsWith('/join')) {
      return <AcceptInvite />;
    }

    if (path.startsWith('/verify')) {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token') || '';
      return <SupplierPortal token={token} />;
    }

    if (path === '/privacy-policy') {
      return <PrivacyPolicy />;
    }

    if (path === '/terms-of-service') {
      return <TermsOfService />;
    }

    // 2. Protected routes
    if (isLoggedIn) {
      if (path === '/onboarding') {
        return <Onboarding />;
      }

      if (path === '/team') {
        return <TeamSettings />;
      }

      if (path.startsWith('/dashboard')) {
        return <Dashboard />;
      }

      // Unknown protected route → redirect to dashboard
      window.history.replaceState({}, '', '/dashboard');
      return <Dashboard />;
    }

    // 3. Default public landing
    return <Landing />;
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      {getContent()}
    </>
  );
}

export default App;
