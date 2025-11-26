import { useEffect, useState } from 'react';
import { useNavigate } from '../lib/router';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function AcceptInvite() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying invitation...');

  useEffect(() => {
    const accept = async () => {
      // 1. Get Token from URL
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Missing invitation token.');
        return;
      }

      // 2. Get Current User
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // If not logged in, we can't accept yet.
        // We store the token and redirect to login/signup.
        // (In a real app, you'd pass this token to the Auth UI to handle post-signup)
        sessionStorage.setItem('pending_invite_token', token);
        // For now, show a message asking them to login manually if your auth flow is simple
        setStatus('error'); 
        setMessage('Please log in or sign up to accept this invitation.');
        return;
      }

      try {
        // 3. Find the invite
        // Note: You might need a specific RLS policy to allow reading invites by token 
        // if the user is not part of the org yet. 
        // For simplicity with "Nuclear RLS", we assume we can read or use a secure function.
        
        const { data: invite, error: fetchError } = await supabase
          .from('organization_invites')
          .select('*')
          .eq('token', token)
          .single();

        if (fetchError || !invite) {
          throw new Error('Invalid or expired invite token.');
        }

        // 4. Add User to Organization
        // We insert directly into members table.
        // The "Nuclear RLS" policy "simple_insert_own" allows inserting if user_id = auth.uid().
        const { error: insertError } = await supabase
          .from('organization_members')
          .insert({
            company_id: invite.company_id,
            user_id: user.id,
            role: invite.role || 'member'
          });

        if (insertError) {
            // If unique constraint fails, they are likely already a member
            if (insertError.code === '23505') {
                console.log("User already a member.");
            } else {
                throw insertError;
            }
        }

        // 5. Delete the used invite
        await supabase.from('organization_invites').delete().eq('id', invite.id);

        setStatus('success');
        setTimeout(() => {
            // Clear any pending token
            sessionStorage.removeItem('pending_invite_token');
            // Force reload to ensure all state (Header, Dashboard) updates
            window.location.href = '/dashboard';
        }, 2000);

      } catch (err: any) {
        console.error("Accept Invite Error:", err);
        setStatus('error');
        setMessage(err.message || 'Failed to accept invitation.');
      }
    };

    accept();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full">
        {status === 'loading' && (
            <>
                <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
                <h2 className="text-xl font-bold text-gray-900">Verifying Invite...</h2>
            </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Welcome to the Team!</h2>
            <p className="text-gray-500 mt-2">Redirecting to workspace...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Invite Error</h2>
            <p className="text-red-600 mt-2 mb-6">{message}</p>
            
            {!message.includes('log in') ? (
                <button onClick={() => navigate('/')} className="text-blue-600 hover:underline font-medium">
                Back to Home
                </button>
            ) : (
                <button 
                    onClick={() => navigate('/')} // Or trigger your login modal
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-bold"
                >
                    Go to Login
                </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}