import { useState } from 'react';

import { useAuditStore } from '../lib/store';

import { t } from '../lib/translations';



interface ScanFormProps {

  onScanComplete: (auditId: string, isPremium: boolean) => void;

}



export function ScanForm({ onScanComplete }: ScanFormProps) {

  // --- This is the fix ---

  // We select each value individually. This stops the infinite loop.

  const language = useAuditStore((state) => state.language);

  const isPremiumFlow = useAuditStore((state) => state.isPremiumFlow);

  // --- End of fix ---



  const [email, setEmail] = useState('');

  const [url, setUrl] = useState('');

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');



  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    setError('');

    setLoading(true);



    if (!email || !url) {

      setError(t('error.generic', language));

      setLoading(false);

      return;

    }



    try {

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;



      const response = await fetch(`${supabaseUrl}/functions/v1/instant-scan`, {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json',

          'Authorization': `Bearer ${supabaseAnonKey}`,

        },

        body: JSON.stringify({ email, url }),

      });



      if (!response.ok) throw new Error('Scan failed');



      const data = await response.json();

      onScanComplete(data.audit_id, isPremiumFlow);

    } catch (err) {

      setError(t('error.generic', language));

    } finally {

      setLoading(false);

    }

  };



  const buttonText = isPremiumFlow

    ? t('cta.getPremium', language)

    : t('cta.startFree', language);



  return (

    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md mx-auto">

      <form onSubmit={handleSubmit} className="space-y-5">

        <div>

          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">

            {t('form.email', language)}

          </label>

          <input

            type="email"

            id="email"

            value={email}

            onChange={(e) => setEmail(e.target.value)}

            placeholder={t('form.emailPlaceholder', language)}

            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"

            required

          />

        </div>



        <div>

          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">

            {t('form.website', language)}

          </label>

          <input

            type="url"

            id="url"

            value={url}

            onChange={(e) => setUrl(e.target.value)}

            placeholder={t('form.websitePlaceholder', language)}

            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"

            required

          />

        </div>



        {error && (

          <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">

            {error}

          </div>

        )}



        <button

          type="submit"

          disabled={loading}

          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"

        >

          {loading ? t('loading', language) : buttonText}

        </button>



        <p className="text-xs text-gray-500 text-center leading-relaxed">

          {t('hero.trustText', language)}

        </p>

      </form>

    </div>

  );

}