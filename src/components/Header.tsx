import { useEffect } from 'react';
import { useAuditStore } from '../lib/store';
import { t } from '../lib/translations';
import { supabase } from '../lib/supabase';
import { useNavigate } from '../lib/router';
import { LoginModal } from './LoginModal';
import { LayoutDashboard } from 'lucide-react';
// Remove navigateToMostRecentAudit if not used elsewhere, or keep it.

export function Header({ onLogout }: { onLogout?: () => void }) { // Accept onLogout prop if passed from App
  const language = useAuditStore((state) => state.language);
  const setLanguage = useAuditStore((state) => state.setLanguage);
  const isLoggedIn = useAuditStore((state) => state.isLoggedIn);
  const setIsLoggedIn = useAuditStore((state) => state.setIsLoggedIn);
  const isLoginModalOpen = useAuditStore((state) => state.isLoginModalOpen);
  const setIsLoginModalOpen = useAuditStore((state) => state.setIsLoginModalOpen);

  const navigate = useNavigate();

  // Check for a logged-in user on component mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [setIsLoggedIn]);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };
  
  // --- THE FIXED LOGIC ---
const goToDashboard = async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      navigate('/');
      return;
    }

    // 1. CHECK MSP STATUS FIRST
    const { count, error: orgError } = await supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id);

    // If they are an MSP, send them to the clean dashboard URL
    if (!orgError && count && count > 0) {
      navigate('/dashboard'); 
      return;
    }

    // 2. IF NOT MSP, DO B2C LOGIC
    const { data, error } = await supabase
      .from('audits')
      .select('id')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      navigate(`/dashboard?id=${data.id}`);
    } else {
      navigate('/');
    }
  };

  const internalLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    navigate('/');
    if (onLogout) onLogout(); // Call parent logout if provided
  };

  const handleLoginSuccess = async () => {
    setIsLoggedIn(true);
    setIsLoginModalOpen(false);
    await goToDashboard();
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Q</span>
              </div>
              <span className="ml-3 text-lg font-semibold text-gray-900">
                Loi96Facile (L96F)
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={toggleLanguage}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                {language === 'en' ? 'EN' : 'FR'}
              </button>

              {isLoggedIn ? (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => void goToDashboard()}
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                  </button>
                  <button
                    onClick={internalLogout}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    {t('header.logout', language)}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  {t('header.login', language)}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}