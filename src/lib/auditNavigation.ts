import { supabase } from './supabase';

export async function fetchMostRecentAuditIdForCurrentUser(): Promise<string | null> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('Error fetching session for dashboard redirect:', sessionError);
    return null;
  }

  if (!session?.user) {
    return null;
  }

  const { data, error } = await supabase
    .from('audits')
    .select('id')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching most recent audit:', error);
    return null;
  }

  return data?.id ?? null;
}

export async function navigateToMostRecentAudit(
  navigate: (path: string) => void,
): Promise<boolean> {
  const auditId = await fetchMostRecentAuditIdForCurrentUser();

  if (auditId) {
    navigate(`/dashboard?id=${auditId}`);
    return true;
  }

  navigate('/dashboard');
  return false;
}
