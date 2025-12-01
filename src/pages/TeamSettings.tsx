// src/pages/TeamSettings.tsx

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Header } from '../components/Header';
import { Trash2, Mail, CheckCircle, Clock, Plus, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export function TeamSettings() {
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Invite Form
  const [newEmail, setNewEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: membership } = await supabase
      .from('organization_members')
      .select('company_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) return;

    const { data: teamMembers } = await supabase
      .from('organization_members')
      .select('id, role, user_id, created_at') 
      .eq('company_id', membership.company_id);

    const { data: pendingInvites } = await supabase
      .from('organization_invites')
      .select('*')
      .eq('company_id', membership.company_id);

    setMembers(teamMembers || []);
    setInvites(pendingInvites || []);
    setLoading(false);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setCreatedLink(null);

    const { data: { user } } = await supabase.auth.getUser();
    const { data: membership } = await supabase
      .from('organization_members')
      .select('company_id')
      .eq('user_id', user?.id)
      .single();

    if (!membership) return;

    const { data, error } = await supabase.from('organization_invites').insert({
      company_id: membership.company_id,
      email: newEmail,
      role: 'member' 
    }).select();

    if (error) {
      toast.error(`Invite failed: ${error.message}`);
    } else {
      setNewEmail('');
      await fetchTeamData(); 
      if (data && data[0]) {
          const link = `${window.location.origin}/join?token=${data[0].token}`;
          setCreatedLink(link);
          toast.success("Invite created!");
      }
    }
    setInviteLoading(false);
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this invitation? The link will no longer work.")) return;

    const { error } = await supabase
      .from('organization_invites')
      .delete()
      .eq('id', id);

    if (error) {
        toast.error("Failed to revoke invite");
    } else {
        toast.success("Invite revoked successfully");
        fetchTeamData();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-500 mt-2">Manage access to your workspace.</p>
        </div>

        {/* --- INVITE SECTION --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600"/> Invite New Member
          </h2>
          
          <form onSubmit={handleInvite} className="flex gap-4 mb-4">
            <input 
              type="email" 
              placeholder="colleague@company.com"
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              required
            />
            <button 
              disabled={inviteLoading}
              className="bg-slate-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              <Plus size={18} />
              {inviteLoading ? 'Sending...' : 'Send Invite'}
            </button>
          </form>

          {createdLink && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-green-800">Invite Created!</h4>
                  <p className="text-xs text-green-700 mb-2">
                    Copy and share this link:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white border border-green-200 p-2 rounded text-xs font-mono text-slate-600 break-all">
                      {createdLink}
                    </code>
                    <button 
                      onClick={() => copyToClipboard(createdLink)}
                      className="px-3 py-2 bg-green-100 text-green-700 text-xs font-bold rounded hover:bg-green-200 transition-colors flex items-center gap-1"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* --- MEMBERS LIST --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-700">Active Members</h3>
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
              {members.length} Seats Active
            </span>
          </div>
          
          <div className="divide-y divide-gray-100">
            {members.map((m) => (
              <div key={m.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {m.role[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">User {m.user_id.slice(0,6)}...</p>
                    <p className="text-xs text-gray-500 capitalize">{m.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- PENDING INVITES --- */}
        {invites.length > 0 && (
          <div>
            <h3 className="font-bold text-gray-700 mb-4 ml-1">Pending Invitations</h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
              {invites.map((inv) => (
                <div key={inv.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{inv.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500">Token: {inv.token.slice(0,8)}...</p>
                        <button 
                          onClick={() => {
                            const link = `${window.location.origin}/join?token=${inv.token}`;
                            navigator.clipboard.writeText(link);
                            toast.info("Link copied to clipboard!");
                          }}
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Copy size={10} /> Copy Link
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* --- FIXED BUTTON --- */}
                  <button 
                    onClick={() => handleRevoke(inv.id)}
                    className="text-sm text-red-500 font-medium hover:underline hover:text-red-700 transition-colors"
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}