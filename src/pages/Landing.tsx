import { useEffect, useState } from 'react';
import { useNavigate } from '../lib/router';
import { useAuditStore } from '../lib/store';
import { t } from '../lib/translations';
import { Header } from '../components/Header';
import { ScanForm } from '../components/ScanForm';
import { PricingSection } from '../components/PricingSection';
import { Footer } from '../components/Footer'; // <-- Import new component
import { navigateToMostRecentAudit } from '../lib/auditNavigation';

export function Landing() {
  const language = useAuditStore((state) => state.language);
  const isLoggedIn = useAuditStore((state) => state.isLoggedIn);
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      setIsRedirecting(false);
      return;
    }

    const redirectToDashboard = async () => {
      setIsRedirecting(true);
      await navigateToMostRecentAudit(navigate);
    };

    void redirectToDashboard();
  }, [isLoggedIn, navigate]);

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />

        <main className="flex items-center justify-center min-h-[60vh] px-4">
          <p className="text-gray-600 text-center max-w-md">
            Redirecting you to your dashboard...
          </p>
        </main>
      </div>
    );
  }

  const handleScanComplete = (auditId: string, isPremium: boolean) => {
    const path = isPremium
      ? `/dashboard?id=${auditId}&flow=premium`
      : `/dashboard?id=${auditId}`;
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main>
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              {/* --- Updated Hero Text --- */}
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                {t('hero.title', language)}
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {t('hero.subtitle', language)}
              </p>
              {/* --- End Updated Hero Text --- */}
            </div>

            <ScanForm onScanComplete={handleScanComplete} />
          </div>
        </section>

        <PricingSection />
      </main>

      <Footer /> {/* <-- Add new component here */}
    </div>
  );
}