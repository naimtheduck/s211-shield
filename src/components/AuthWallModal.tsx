import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuditStore } from '../lib/store';
import { t } from '../lib/translations';
import { supabase } from '../lib/supabase';

interface AuthWallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Called after successful auth
  email: string;
}

export function AuthWallModal({ isOpen, onClose, onSuccess, email: propEmail }: AuthWallModalProps) {
  // --- This is the fix ---
  // We must select each value individually to prevent loops.
  const language = useAuditStore((state) => state.language);
  const auditId = useAuditStore((state) => state.auditId);
  // --- End of fix ---

  const [email, setEmail] = useState(propEmail || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Effect to update email if prop changes (e.g., loads after modal opens)
  useEffect(() => {
    setEmail(propEmail || '');
  }, [propEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!auditId) {
      setError('Audit ID not found. Please refresh.');
      setLoading(false);
      return;
    }

    // 1. Call the auth-claim-account function
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/auth-claim-account`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            email,
            password,
            audit_id: auditId,
          }),
        }
      );

      const claimResult = await response.json();
      if (!response.ok || claimResult.error) {
        throw new Error(claimResult.error || 'Failed to claim account.');
      }

      // 2. Sign the user in to the frontend
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw new Error(signInError.message);
      }

      // 3. Success!
      setLoading(false);
      onSuccess(); // Tell the dashboard we're authenticated
    } catch (err)
    {
      const error = err as Error;
      setError(error.message);
      setLoading(false);
    }
  };

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
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {language === 'en' ? 'Create Account to Continue' : 'Créez un compte pour continuer'}
          </h2>
          <p className="text-gray-600 leading-relaxed">
            {language === 'en'
              ? 'Save your progress and unlock features by creating a free account.'
              : 'Sauvegardez vos progrès et débloquez des fonctionnalités en créant un compte gratuit.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="auth-email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t('form.email', language)}
            </label>
            <input
              type="email"
              id="auth-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('form.emailPlaceholder', language)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="auth-password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {language === 'en' ? 'Password' : 'Mot de passe'}
            </label>
            <input
              type="password"
              id="auth-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? t('loading', language) : (language === 'en' ? 'Create Account' : 'Créer un compte')}
          </button>
        </form>
      </div>
    </div>
  );
}