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
        // If not logged in, store token and redirect to landing page
        // The login modal will trigger, and after login they'll be redirected back
        sessionStorage.setItem('pending_invite_token', token);
        setStatus('error'); 
        setMessage('Please log in or sign up to accept this invitation.');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        return;
      }

      try {
        console.log('🔍 Looking up invite with token:', token);
        
        // 3. Find the invite
        const { data: invite, error: fetchError } = await supabase
          .from('organization_invites')
          .select('*')
          .eq('token', token)
          .single();

        console.log('📧 Invite lookup result:', { invite, fetchError });

        if (fetchError) {
          console.error('❌ Fetch error:', fetchError);
          
          // RLS ISSUE: If we can't read the invite, it's likely an RLS problem
          if (fetchError.code === 'PGRST116') {
            throw new Error('Could not find invite. This may be an RLS policy issue. Check that organization_invites allows reading by token.');
          }
          throw new Error(fetchError.message);
        }

        if (!invite) {
          throw new Error('Invalid or expired invite token.');
        }

        console.log('✅ Found invite for company:', invite.company_id);

        // 4. Add User to Organization
        console.log('🔐 Attempting to add user to organization...');
        const { error: insertError } = await supabase
          .from('organization_members')
          .insert({
            company_id: invite.company_id,
            user_id: user.id,
            role: invite.role || 'member'
          });

        if (insertError) {
            console.error('❌ Insert error:', insertError);
            
            // If unique constraint fails, they are likely already a member
            if (insertError.code === '23505') {
                console.log("✅ User already a member - continuing...");
            } else {
                throw insertError;
            }
        } else {
            console.log('✅ Successfully added user to organization');
        }

        // 5. Delete the used invite
        console.log('🗑️ Deleting used invite...');
        const { error: deleteError } = await supabase
          .from('organization_invites')
          .delete()
          .eq('id', invite.id);
          
        if (deleteError) {
          console.warn('⚠️ Could not delete invite:', deleteError);
          // Non-critical, continue anyway
        }

        console.log('🎉 Invite accepted successfully!');
        setStatus('success');
        setMessage('Successfully joined the team!');
        
        setTimeout(() => {
            // Clear any pending token
            sessionStorage.removeItem('pending_invite_token');
            console.log('🚀 Redirecting to dashboard...');
            // Force reload to ensure all state (Header, Dashboard) updates
            window.location.href = '/dashboard';
        }, 2000);

      } catch (err: any) {
        console.error("❌ Accept Invite Error:", err);
        setStatus('error');
        setMessage(err.message || 'Failed to accept invitation.');
        
        // CRITICAL: Clear the pending token to prevent loop
        sessionStorage.removeItem('pending_invite_token');
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
            <p className="text-gray-600 mt-2 mb-6">{message}</p>
            
            <div className="space-y-3">
              {message.includes('log in') ? (
                  <>
                      <p className="text-sm text-gray-500">Redirecting to login...</p>
                      <button 
                          onClick={() => window.location.href = '/'} 
                          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-bold"
                      >
                          Go to Login Now
                      </button>
                  </>
              ) : (
                  <>
                      <button 
                          onClick={() => {
                              sessionStorage.removeItem('pending_invite_token');
                              navigate('/dashboard');
                          }} 
                          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-bold"
                      >
                          Go to Dashboard Anyway
                      </button>
                      <button 
                          onClick={() => {
                              sessionStorage.removeItem('pending_invite_token');
                              navigate('/');
                          }} 
                          className="text-blue-600 hover:underline font-medium text-sm"
                      >
                          Back to Home
                      </button>
                      
                      {/* Debug Info */}
                      <details className="mt-4 text-left bg-gray-100 p-3 rounded text-xs">
                          <summary className="cursor-pointer font-mono text-gray-600">Debug Info</summary>
                          <pre className="mt-2 overflow-auto">{JSON.stringify({ token, message }, null, 2)}</pre>
                      </details>
                  </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
