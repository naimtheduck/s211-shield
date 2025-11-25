import { useEffect, useState } from 'react';
import { useRouter } from './lib/router';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import MSPAuditPage from './pages/MSPAuditPage'; // Import the new B2B Page
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { useAuditStore } from './lib/store';
import { supabase } from './lib/supabase';
import { Header } from './components/Header'; // Ensure Header is imported if you want it on B2B page

function App() {
  const path = useRouter();
  const language = useAuditStore((state) => state.language);
  const isLoggedIn = useAuditStore((state) => state.isLoggedIn);
  const setIsLoggedIn = useAuditStore((state) => state.setIsLoggedIn);

  // Parse query params helper
  const getQueryParam = (param: string): string | null => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get(param);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    window.location.href = '/'; 
  };

  // Check for dashboard routes
  if (path.startsWith('/dashboard')) {
    // Try to get audit ID
    let auditId = getQueryParam('id');
    
    if (!auditId && path.includes('/dashboard/')) {
      auditId = path.split('/dashboard/')[1]?.split('?')[0];
    }

    const isPremiumFlow = getQueryParam('flow') === 'premium';
    const mode = isLoggedIn ? 'authenticated' : 'demo';

    // WE REMOVED THE IMMEDIATE REDIRECT HERE.
    // We pass the responsibility to DashboardWrapper to decide 
    // if a missing ID is okay (which it IS for MSPs).

    return (
      <DashboardWrapper
        auditId={auditId} // Can now be null
        language={language}
        mode={mode}
        isPremiumFlow={isPremiumFlow}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
      />
    );
  }

  // Check for Privacy Policy
  if (path.startsWith('/privacy-policy')) {
    return <PrivacyPolicy />;
  }

  // Check for Terms of Service
  if (path.startsWith('/terms-of-service')) {
    return <TermsOfService />;
  }

  // Default to Landing page
  return <Landing />;
}

// --- THE LOGIC CORE ---
function DashboardWrapper({
  auditId,
  language,
  mode,
  isPremiumFlow,
  isLoggedIn,
  onLogout,
}: {
  auditId: string | null; // Changed to nullable
  language: "en" | "fr";
  mode: "authenticated" | "demo";
  isPremiumFlow: boolean;
  isLoggedIn: boolean;
  onLogout: () => void;
}) {
  // State
  const [isMSP, setIsMSP] = useState(false);
  const [checkingMSP, setCheckingMSP] = useState(true);
  
  // B2C Data State
  const [initialAiFix, setInitialAiFix] = useState<string | null>(null);
  const [checklistData, setChecklistData] = useState<Record<string, unknown> | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // 1. CHECK IF USER IS MSP (Organization Member)
  useEffect(() => {
    async function checkUserRole() {
      if (!isLoggedIn) {
        setCheckingMSP(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Check if they belong to any organization
        const { count, error } = await supabase
          .from('organization_members')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (!error && count && count > 0) {
          setIsMSP(true);
        }
      }
      setCheckingMSP(false);
    }

    checkUserRole();
  }, [isLoggedIn]);

  // 2. FETCH B2C AUDIT DATA (Only if we have an ID and aren't sure about MSP yet)
  useEffect(() => {
    async function fetchAudit() {
      if (!auditId) {
        setIsLoadingData(false);
        return;
      }

      setIsLoadingData(true);
      try {
        const { data, error } = await supabase
          .from('audits')
          .select('ai_fix, checklist_data')
          .eq('id', auditId)
          .single();

        if (data) {
          setInitialAiFix(data.ai_fix || null);
          setChecklistData(data.checklist_data || null);
        }
      } catch (err) {
        console.error('Error fetching audit:', err);
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchAudit();
  }, [auditId]);

  // --- RENDER LOGIC ---

  // A. Loading Screen
  if (checkingMSP || (auditId && isLoadingData)) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // B. MSP / B2B FLOW
  // If they are an MSP, show them the Expert Page (Bypassing standard dashboard)
  if (isMSP) {
    return (
      <>
        <Header onLogout={onLogout} />
        <MSPAuditPage /> 
      </>
    );
  }

  // D. B2C STANDARD DASHBOARD
  return (
    <Dashboard />
  );
}

export default App;