import { X } from 'lucide-react';
import { useAuditStore } from '../lib/store';
import { t } from '../lib/translations';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PaywallModal({ isOpen, onClose }: PaywallModalProps) {
  const language = useAuditStore((state) => state.language);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={t('paywall.close', language)}
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {t('paywall.title', language)}
          </h2>
          <p className="text-gray-600 leading-relaxed">
            {t('paywall.body', language)}
          </p>
        </div>

        <div className="space-y-3">
          <a
            href="https://buy.stripe.com/placeholder"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
          >
            {t('cta.unlockPremium', language)}
          </a>
          <button
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            {t('paywall.close', language)}
          </button>
        </div>
      </div>
    </div>
  );
}
