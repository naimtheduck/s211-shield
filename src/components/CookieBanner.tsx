import { useState, useEffect } from 'react';
import { useAuditStore } from '../lib/store';
import { t } from '../lib/translations';

export function CookieBanner() {
  const language = useAuditStore((state) => state.language);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the user has already made a choice
    const consent = localStorage.getItem('cookie_consent');
    if (consent === null) {
      // No choice made, show the banner
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'true');
    setIsVisible(false);
    // In the future, you would initialize your analytics here, e.g.:
    // if (typeof window.gtag === 'function') {
    //   window.gtag('consent', 'update', { 'analytics_storage': 'granted' });
    // }
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'false');
    setIsVisible(false);
    // You would set analytics to 'denied' here
    // if (typeof window.gtag === 'function') {
    //   window.gtag('consent', 'update', { 'analytics_storage': 'denied' });
    // }
  };

  if (!isVisible) {
    return null; // Don't render anything if choice is made
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white p-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center">
        <p className="text-sm mb-4 sm:mb-0 sm:mr-4">
          {t('cookieBanner.message', language)}{' '}
          <a
            href="/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-300"
          >
            {t('cookieBanner.privacyLink', language)}
          </a>
        </p>
        <div className="flex-shrink-0 flex space-x-3">
          <button
            onClick={handleDecline}
            className="px-4 py-2 text-sm font-medium bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            {t('cookieBanner.decline', language)}
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {t('cookieBanner.accept', language)}
          </button>
        </div>
      </div>
    </div>
  );
}