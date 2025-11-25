import { Check, Lock } from 'lucide-react';
import { useAuditStore } from '../lib/store';
import { t } from '../lib/translations';

export function PricingSection() {
  const language = useAuditStore((state) => state.language);
  const setPremiumFlow = useAuditStore((state) => state.setPremiumFlow);

  const scrollToForm = (isPremium: boolean = false) => {
    setPremiumFlow(isPremium);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          {t('pricing.title', language)}
        </h2>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* --- FREE PLAN --- */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {t('pricing.free.title', language)}
              </h3>
              <p className="text-gray-600 mb-4">{t('pricing.free.subtitle', language)}</p>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-gray-900">
                  {t('pricing.free.price', language)}
                </span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{t('pricing.free.feature1', language)}</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{t('pricing.free.feature2', language)}</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{t('pricing.free.feature3', language)}</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{t('pricing.free.feature4', language)}</span>
              </li>
              <li className="flex items-start">
                <Lock className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-500 line-through">
                  {t('pricing.free.locked', language)}
                </span>
              </li>
            </ul>

            <button
              onClick={() => scrollToForm(false)}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {t('cta.startFree', language)}
            </button>
          </div>

          {/* --- PREMIUM PLAN (Updated) --- */}
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border-2 border-blue-300 p-8 shadow-md hover:shadow-lg transition-shadow relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                {t('pricing.premium.discountBadge', language)} {/* <-- 50% OFF Badge */}
              </span>
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {t('pricing.premium.title', language)}
              </h3>
              <p className="text-gray-600 mb-4">{t('pricing.premium.subtitle', language)}</p>
              <div className="flex items-baseline space-x-2">
                {/* --- New Pricing UI --- */}
                <span className="text-4xl font-bold text-gray-900">
                  {t('pricing.premium.price', language)}
                </span>
                <span className="text-2xl font-medium text-gray-400 line-through">
                  {t('pricing.premium.originalPrice', language)}
                </span>
                {/* --- End New Pricing UI --- */}
                <span className="text-gray-600">
                  {t('pricing.premium.oneTime', language)}
                </span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{t('pricing.premium.feature1', language)}</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{t('pricing.premium.feature2', language)}</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{t('pricing.premium.feature3', language)}</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{t('pricing.premium.feature4', language)}</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{t('pricing.premium.feature5', language)}</span>
              </li>
            </ul>

            <button
              onClick={() => scrollToForm(true)}
              className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
            >
              {t('cta.getPremium', language)}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}