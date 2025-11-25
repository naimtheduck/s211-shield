import { Check, X, AlertTriangle, Info, Sparkles } from 'lucide-react';
import { useAuditStore } from '../lib/store';
import { t } from '../lib/translations';

interface AutoScanResultsProps {
  onFixClick: () => void;
  forceFixButton?: boolean;
}

export function AutoScanResults({ onFixClick, forceFixButton = false }: AutoScanResultsProps) {
  const language = useAuditStore((state) => state.language);
  const scanResults = useAuditStore((state) => state.scanResults);
  const isPremium = useAuditStore((state) => state.isPremium);

  if (!scanResults) return null;

  const getStatusIcon = (status: string) => {
    if (status === 'found' || status === 'fr') return <Check className="w-5 h-5 text-green-600" />;
    if (status === 'partial') return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    return <X className="w-5 h-5 text-red-600" />;
  };

  const getStatusText = (status: string) => {
    if (status === 'found' || status === 'fr') return t('dashboard.autoScan.found', language);
    if (status === 'partial') return t('dashboard.autoScan.partial', language);
    return t('dashboard.autoScan.notFound', language);
  };

  const getStatusColor = (status: string) => {
    if (status === 'found' || status === 'fr') return 'text-green-700 bg-green-50';
    if (status === 'partial') return 'text-amber-700 bg-amber-50';
    return 'text-red-700 bg-red-50';
  };

  const scanItems = [
    {
      label: t('dashboard.autoScan.privacyPolicy', language),
      status: scanResults.privacy_policy,
      info: t('dashboard.autoScan.privacyPolicy.info', language),
    },
    {
      label: t('dashboard.autoScan.cookieConsent', language),
      status: scanResults.cookie_consent,
      info: t('dashboard.autoScan.cookieConsent.info', language),
    },
    {
      label: t('dashboard.autoScan.languageTag', language),
      status: scanResults.language_tag,
      info: t('dashboard.autoScan.languageTag.info', language),
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          {t('dashboard.autoScan.title', language)}
        </h2>

        {/* --- ADD THIS BUTTON --- */}
        {forceFixButton && (
          <button
            onClick={onFixClick}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate AI Fix
          </button>
        )}
      </div>

      <div className="space-y-4">
        {scanItems.map((item, index) => (
          <div
            key={index}
            className="p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(item.status)}
                <div>
                  <p className="font-medium text-gray-900">{item.label}</p>
                  <span className={`text-sm px-2 py-1 rounded ${getStatusColor(item.status)}`}>
                    {getStatusText(item.status)}
                  </span>
                </div>
              </div>

              {(item.status === 'not_found' || item.status === 'partial') && !isPremium && !forceFixButton && (
                <button
                  onClick={onFixClick}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {t('dashboard.autoScan.fixIt', language)}
                </button>
              )}
            </div>

            {!isPremium && (item.status === 'not_found' || item.status === 'partial') && (
              <div className="mt-4 pt-3 border-t border-gray-200 flex items-start space-x-2 text-gray-600">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{item.info}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
