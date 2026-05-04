import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, Button, Spinner } from '../../components/ui';
import { ShieldCheck, Users, Trash2, CheckCircle2, XCircle, Mail, User } from 'lucide-react';
import type { Profile } from '../../store/useAuthStore';

const UserControl = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending'>('all');

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('profiles').select('*');
      
      if (filter === 'pending') {
        query = query.eq('role', 'teacher').eq('status', 'pending');
      }

      const { data, error } = await query;
      console.log('DEBUG: Fetch Users Data:', data);
      console.log('DEBUG: Fetch Users Error:', error);
      
      if (error) throw error;
      if (data && data.length === 0) {
        console.warn('DEBUG: Query successful but returned 0 rows');
      }
      setUsers(data || []);
    } catch (err: any) {
      console.error('Error fetching users:', err.message);
      alert('Debug Error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'student' | 'teacher' | 'super_admin') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err: any) {
      alert('Gagal memperbarui peran.');
    }
  };

  const handleVerify = async (userId: string, status: 'active' | 'suspended') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', userId);

      if (error) throw error;
      
      // Update local state instead of removing if we are in "all" filter
      if (filter === 'pending') {
        setUsers(prev => prev.filter(u => u.id !== userId));
      } else {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
      }
      alert(status === 'active' ? 'Status berhasil diperbarui!' : 'Pengguna ditangguhkan.');
    } catch (err: any) {
      alert('Gagal memproses verifikasi.');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Hapus pengguna "${userName}" secara permanen? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
      setUsers(prev => prev.filter(u => u.id !== userId));
      alert('Pengguna berhasil dihapus.');
    } catch (err: any) {
      alert('Gagal menghapus pengguna: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Kontrol Pengguna</h1>
          <p className="text-sm text-slate-500 font-medium italic">Kelola verifikasi pengajar dan hak akses sistem.</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          <button 
            onClick={() => setFilter('pending')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              filter === 'pending' ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-100' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Pending
          </button>
          <button 
            onClick={() => setFilter('all')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              filter === 'all' ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-100' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Semua
          </button>
        </div>
      </div>

      <Card className="overflow-hidden border-none shadow-2xl shadow-slate-100">
        <div className="p-0">
          {isLoading ? (
            <div className="p-20 flex flex-col items-center justify-center space-y-6">
              <Spinner className="w-10 h-10 text-indigo-600" />
              <p className="text-sm text-slate-400 font-black uppercase tracking-widest">Sinkronisasi Data...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-20 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto text-slate-200">
                <Users className="w-10 h-10" />
              </div>
              <p className="text-slate-400 font-black text-lg">Tidak ada pengguna yang ditemukan.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {users.map((u) => (
                <div key={u.id} className="p-8 hover:bg-slate-50/50 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center border-4 border-white shadow-xl font-black text-2xl ${
                      u.role === 'teacher' ? 'bg-amber-100 text-amber-600' : 
                      u.role === 'super_admin' ? 'bg-indigo-600 text-white' : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="w-full h-full object-cover rounded-[20px]" />
                      ) : (
                        u.full_name?.charAt(0) || <User className="w-8 h-8" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-black text-slate-900 text-lg tracking-tight">{u.full_name}</h3>
                        {u.status === 'active' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-600 tracking-widest">Pending</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400">
                        <span className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-lg text-slate-600"><Mail className="w-3.5 h-3.5" /> {u.email}</span>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] uppercase tracking-widest text-slate-300">Peran:</span>
                           <select 
                            value={u.role} 
                            onChange={(e) => handleUpdateRole(u.id, e.target.value as any)}
                            className="bg-indigo-50 text-indigo-600 border-none rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                           >
                             <option value="student">Siswa</option>
                             <option value="teacher">Guru</option>
                             <option value="super_admin">Admin</option>
                           </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full lg:w-auto">
                    {u.status === 'pending' ? (
                      <>
                        <Button 
                          onClick={() => handleVerify(u.id, 'active')}
                          className="flex-1 lg:flex-none bg-emerald-500 hover:bg-emerald-600 h-12 px-6 rounded-2xl shadow-lg shadow-emerald-100"
                        >
                          <ShieldCheck className="w-4 h-4 mr-2" /> Setujui
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => handleVerify(u.id, 'suspended')}
                          className="flex-1 lg:flex-none text-rose-500 border-rose-100 hover:bg-rose-50 h-12 px-6 rounded-2xl"
                        >
                          <XCircle className="w-4 h-4 mr-2" /> Tolak
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant="ghost" 
                          onClick={() => handleVerify(u.id, u.status === 'active' ? 'suspended' : 'active')}
                          className={`flex-1 lg:flex-none h-11 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest ${
                            u.status === 'active' ? 'text-rose-500' : 'text-emerald-500'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Aktifkan'}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u.id, u.full_name || 'Pengguna')} className="h-11 w-11 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all">
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default UserControl;
