import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, Button, Spinner } from '../../components/ui';
import { ShieldCheck, Users, Trash2, CheckCircle2, XCircle, Mail, User } from 'lucide-react';
import type { Profile } from '../../store/useAuthStore';

const UserControl = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending'>('pending');

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('profiles').select('*');
      
      if (filter === 'pending') {
        query = query.eq('role', 'teacher').eq('status', 'pending');
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      console.error('Error fetching users:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (userId: string, status: 'active' | 'suspended') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', userId);

      if (error) throw error;
      
      // Update local state
      setUsers(prev => prev.filter(u => u.id !== userId));
      alert(status === 'active' ? 'Pengajar berhasil diverifikasi!' : 'Pengajar ditangguhkan.');
    } catch (err: any) {
      alert('Gagal memproses verifikasi.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Kontrol Pengguna</h1>
          <p className="text-sm text-slate-500 font-medium italic">Kelola verifikasi pengajar dan hak akses sistem.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              filter === 'pending' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Menunggu Verifikasi
          </button>
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              filter === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Semua Pengguna
          </button>
        </div>
      </div>

      <Card className="overflow-hidden border-none shadow-xl shadow-slate-200/50">
        <div className="p-0">
          {isLoading ? (
            <div className="p-20 flex flex-col items-center justify-center space-y-4">
              <Spinner className="w-8 h-8 text-indigo-600" />
              <p className="text-sm text-slate-400 font-medium">Memuat data pengguna...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-20 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <Users className="w-8 h-8" />
              </div>
              <p className="text-slate-400 font-medium">Tidak ada pengguna {filter === 'pending' ? 'yang menunggu verifikasi' : ''}.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {users.map((u) => (
                <div key={u.id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 border-white shadow-sm font-black text-xl ${
                      u.role === 'teacher' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
                    }`}>
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        u.full_name?.charAt(0) || <User className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-slate-900">{u.full_name}</h3>
                        {u.status === 'active' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        {u.status === 'pending' && <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-100 text-amber-600">Pending</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {u.email}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span className="uppercase tracking-widest">{u.role}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {u.status === 'pending' && (
                      <>
                        <Button 
                          onClick={() => handleVerify(u.id, 'active')}
                          className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-600 h-10 px-4"
                        >
                          <ShieldCheck className="w-4 h-4" /> Verifikasi
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => handleVerify(u.id, 'suspended')}
                          className="flex-1 sm:flex-none text-rose-500 border-rose-100 hover:bg-rose-50 h-10 px-4"
                        >
                          <XCircle className="w-4 h-4" /> Tolak
                        </Button>
                      </>
                    )}
                    {u.status === 'active' && u.role === 'teacher' && (
                      <Button variant="outline" size="sm" className="text-slate-400">Suspend</Button>
                    )}
                    <Button variant="ghost" size="icon" className="text-slate-300 hover:text-rose-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
