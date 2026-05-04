import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { Card, Button, Input } from '../../components/ui';
import { User, Mail, Shield, Edit2, Save, X, Phone, School, MapPin, AlignLeft } from 'lucide-react';


const ProfilePage = () => {
  const { profile, setProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [schoolName, setSchoolName] = useState(profile?.school_name || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [isLoading, setIsLoading] = useState(false);


  const handleUpdateProfile = async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName,
          phone: phone,
          school_name: schoolName,
          address: address,
          bio: bio
        })
        .eq('id', profile.id)
        .select()
        .single();


      if (error) throw error;
      setProfile(data);
      setIsEditing(false);
      alert('Profil berhasil diperbarui!');
    } catch (err: any) {
      alert('Gagal memperbarui profil: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Profil Pengguna</h1>
          <p className="text-slate-500 font-medium italic mt-2">Kelola informasi akun dan pantau pencapaian Anda.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="p-8 text-center space-y-6 flex flex-col items-center border-none shadow-2xl shadow-slate-200/50">
          <div className="relative group">
            <div className="w-32 h-32 bg-indigo-100 rounded-[40px] flex items-center justify-center text-indigo-600 font-black text-4xl border-4 border-white shadow-xl overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                profile?.full_name?.charAt(0) || <User className="w-12 h-12" />
              )}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">{profile?.full_name}</h2>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-1">{profile?.role}</p>
          </div>
          <div className="w-full pt-6 border-t border-slate-50 grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-xl font-black text-slate-900">{profile?.total_xp || 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total XP</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-slate-900">
                {profile?.role === 'teacher' ? '12' : '4'}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {profile?.role === 'teacher' ? 'Kelas' : 'Sertifikat'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="md:col-span-2 p-8 space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Detail Informasi</h3>
            {!isEditing ? (
              <Button variant="ghost" onClick={() => setIsEditing(true)} className="text-indigo-600 h-10">
                <Edit2 className="w-4 h-4 mr-2" /> Edit Profil
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setIsEditing(false)} className="text-slate-400 h-10">
                  <X className="w-4 h-4 mr-2" /> Batal
                </Button>
                <Button onClick={handleUpdateProfile} isLoading={isLoading} className="h-10">
                  <Save className="w-4 h-4 mr-2" /> Simpan
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <User className="w-3 h-3" /> Nama Lengkap
              </label>
              {isEditing ? (
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-14 bg-slate-50 border-none rounded-2xl" />
              ) : (
                <div className="h-14 bg-slate-50 rounded-2xl px-4 flex items-center font-bold text-slate-700">
                  {profile?.full_name}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Mail className="w-3 h-3" /> Alamat Email
              </label>
              <div className="h-14 bg-slate-50 rounded-2xl px-4 flex items-center font-bold text-slate-400 italic">
                {profile?.email}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Shield className="w-3 h-3" /> Peran Akun
              </label>
              <div className="h-14 bg-slate-50 rounded-2xl px-4 flex items-center font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                {profile?.role}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Phone className="w-3 h-3" /> Nomor WhatsApp
                </label>
                {isEditing ? (
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0812..." className="h-14 bg-slate-50 border-none rounded-2xl" />
                ) : (
                  <div className="h-14 bg-slate-50 rounded-2xl px-4 flex items-center font-bold text-slate-700">
                    {profile?.phone || '-'}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <School className="w-3 h-3" /> Sekolah / Instansi
                </label>
                {isEditing ? (
                  <Input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="Nama Sekolah" className="h-14 bg-slate-50 border-none rounded-2xl" />
                ) : (
                  <div className="h-14 bg-slate-50 rounded-2xl px-4 flex items-center font-bold text-slate-700">
                    {profile?.school_name || '-'}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <MapPin className="w-3 h-3" /> Alamat
              </label>
              {isEditing ? (
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Alamat Lengkap" className="h-14 bg-slate-50 border-none rounded-2xl" />
              ) : (
                <div className="h-14 bg-slate-50 rounded-2xl px-4 flex items-center font-bold text-slate-700">
                  {profile?.address || '-'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <AlignLeft className="w-3 h-3" /> Bio Singkat
              </label>
              {isEditing ? (
                <textarea 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)} 
                  className="w-full min-h-[100px] bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ceritakan sedikit tentang dirimu..."
                />
              ) : (
                <div className="min-h-[100px] bg-slate-50 rounded-2xl p-4 font-bold text-slate-700">
                  {profile?.bio || 'Belum ada bio.'}
                </div>
              )}
            </div>

          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
