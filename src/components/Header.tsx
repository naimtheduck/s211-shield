// src/components/Header.tsx

import { useEffect, useState } from 'react';
import { useAuditStore } from '../lib/store';
import { t } from '../lib/translations';
import { supabase } from '../lib/supabase';
import { useNavigate } from '../lib/router';
import { LoginModal } from './LoginModal';
// Added Linkedin to imports
import { LayoutDashboard, Users, Linkedin } from 'lucide-react';

export function Header({ onLogout }: { onLogout?: () => void }) {
  const language = useAuditStore((state) => state.language);
  const setLanguage = useAuditStore((state) => state.setLanguage);
  const isLoggedIn = useAuditStore((state) => state.isLoggedIn);
  const setIsLoggedIn = useAuditStore((state) => state.setIsLoggedIn);
  const isLoginModalOpen = useAuditStore((state) => state.isLoginModalOpen);
  const setIsLoginModalOpen = useAuditStore((state) => state.setIsLoginModalOpen);

  const navigate = useNavigate();
  const [hasOrg, setHasOrg] = useState(false);

  // Check for a logged-in user on component mount & Org Status
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      setIsLoggedIn(!!user);

      if (user) {
        // Check if they belong to an org (to show Team button)
        const { count } = await supabase
          .from('organization_members')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        setHasOrg(!!count && count > 0);
      }
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      if (session) checkUser();
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [setIsLoggedIn]);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };
  
  const goToDashboard = async () => {
    navigate('/dashboard');
  };

  const internalLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setHasOrg(false);
    navigate('/');
    if (onLogout) onLogout(); 
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
            {/* --- LOGO & NAME SECTION --- */}
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <img 
                src="/logo.png" 
                alt="The Compass Labs Logo" 
                className="w-10 h-10 object-contain rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              {/* Fallback "C" icon if image is missing */}
              <div className="hidden w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              
              <span className="ml-3 text-lg font-semibold text-gray-900">
                The Compass Labs
              </span>
            </div>

            <div className="flex items-center space-x-2">
              
              {/* --- NEW CONTACT SECTION --- */}
              <a
                href="https://www.linkedin.com/in/alejandro-monge1/" // <--- PASTE YOUR LINKEDIN URL HERE
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Linkedin className="w-4 h-4 mr-2" />
                Contact
              </a>
              {/* --------------------------- */}

              <button
                onClick={toggleLanguage}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                {language === 'en' ? 'EN' : 'FR'}
              </button>

              {isLoggedIn ? (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </button>
                  
                  {hasOrg && (
                    <button
                      onClick={() => navigate('/team')}
                      className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Team
                    </button>
                  )}

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