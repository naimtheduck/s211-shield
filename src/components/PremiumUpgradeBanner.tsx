import { Lock, Sparkles, CheckCircle } from 'lucide-react';
import { useAuditStore } from '../lib/store';
import { t } from '../lib/translations';

interface PremiumUpgradeBannerProps {
  onUpgradeClick: () => void;
}

export function PremiumUpgradeBanner({ onUpgradeClick }: PremiumUpgradeBannerProps) {
  const language = useAuditStore((state) => state.language);

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 sm:p-8 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        {/* Left Side: Value Proposition */}
        <div className="flex-1 mb-6 sm:mb-0 sm:pr-8">
          <div className="flex items-center mb-2">
            <Sparkles className="w-6 h-6 mr-2 opacity-90" />
            <h2 className="text-2xl font-bold">
              {t('banner.premium.title', language)}
            </h2>
          </div>
          <p className="text-blue-100 opacity-90 leading-relaxed mb-4">
            {t('banner.premium.body', language)}
          </p>
          
          <ul className="space-y-2 text-sm">
            <li className="flex items-center text-blue-50">
              <CheckCircle className="w-4 h-4 mr-2 text-green-300" />
              {t('banner.premium.feature1', language)}
            </li>
            <li className="flex items-center text-blue-50">
              <CheckCircle className="w-4 h-4 mr-2 text-green-300" />
              {t('banner.premium.feature2', language)}
            </li>
            <li className="flex items-center text-blue-50">
              <CheckCircle className="w-4 h-4 mr-2 text-green-300" />
              {t('banner.premium.feature3', language)}
            </li>
          </ul>
        </div>

        {/* Right Side: CTA Button */}
        <div className="flex-shrink-0">
          <button
            onClick={onUpgradeClick}
            className="w-full sm:w-auto bg-white text-blue-700 font-bold py-3 px-6 rounded-lg shadow-md hover:bg-gray-100 transition-colors transform hover:scale-105 flex items-center justify-center"
          >
            <Lock className="w-4 h-4 mr-2" />
            {t('cta.unlockPremium', language)}
          </button>
        </div>
      </div>
    </div>
  );
}