import { useAuditStore } from '../lib/store';
import { t } from '../lib/translations';

export function Footer() {
  const language = useAuditStore((state) => state.language);
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-top border-gray-200 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
          <p className="mb-4 sm:mb-0">
            {t('footer.copyright', language).replace(
              '{year}',
              currentYear.toString()
            )}
          </p>

          <div className="flex space-x-4">
            <a
              href="/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors"
            >
              {t('footer.privacy', language)}
            </a>
            <a
              href="/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors"
            >
              {t('footer.terms', language)}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
