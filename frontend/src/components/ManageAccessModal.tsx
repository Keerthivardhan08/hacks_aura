"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { X, UserPlus, Shield, Trash2 } from "lucide-react";

export default function ManageAccessModal({ 
  hackathonId, 
  isOpen, 
  onClose 
}: { 
  hackathonId: string; 
  isOpen: boolean; 
  onClose: () => void 
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [grantedUsers, setGrantedUsers] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchGrantedUsers();
    }
  }, [isOpen]);

  const fetchGrantedUsers = async () => {
    // This requires a join to get user emails, but auth.users is restricted.
    // As a workaround for this prototype, we'll just show the user IDs.
    // In a real app, we'd use a public profiles table.
    const { data } = await supabase
      .from('hackathon_access')
      .select('id, user_id, created_at')
      .eq('hackathon_id', hackathonId);
    
    setGrantedUsers(data || []);
  };

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      // 1. Find the user's ID by their email using our secure database function
      const { data: targetUserId, error: rpcError } = await supabase
        .rpc('get_user_id_by_email', { user_email: email.trim().toLowerCase() });

      if (rpcError) throw rpcError;
      if (!targetUserId) throw new Error("No user found with that email address. Make sure they have signed up.");
      
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('hackathon_access').insert({
        hackathon_id: hackathonId,
        user_id: targetUserId,
        granted_by: user?.id
      });

      if (error) {
        if (error.code === '23505') throw new Error("User already has access");
        if (error.code === '23503') throw new Error("Invalid User ID - User does not exist");
        throw error;
      }

      setMessage({ text: "Access granted successfully!", type: 'success' });
      setEmail("");
      fetchGrantedUsers();
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to grant access", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const revokeAccess = async (accessId: string) => {
    await supabase.from('hackathon_access').delete().eq('id', accessId);
    fetchGrantedUsers();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Manage Access
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <form onSubmit={handleGrantAccess} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Grant Access to User (Enter Email Address)
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  required
                />
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  Grant
                </button>
              </div>
            </div>
            
            {message && (
              <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {message.text}
              </div>
            )}
          </form>

          <div className="pt-4 border-t border-gray-800">
            <h4 className="text-sm font-medium text-gray-400 mb-3">Users with Access</h4>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
              {grantedUsers.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No users have been granted access yet.</p>
              ) : (
                grantedUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
                    <span className="text-sm text-gray-300 font-mono truncate mr-4" title={u.user_id}>
                      {u.user_id}
                    </span>
                    <button 
                      onClick={() => revokeAccess(u.id)}
                      className="text-gray-500 hover:text-red-400 p-1"
                      title="Revoke Access"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
