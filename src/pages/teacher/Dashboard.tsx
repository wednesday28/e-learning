import { Card, Button } from '../../components/ui';
import { useAuthStore } from '../../store/useAuthStore';
import { ShieldAlert, Clock, CheckCircle, Users, BookOpen, Activity } from 'lucide-react';

const TeacherDashboard = () => {
  const { profile } = useAuthStore();
  const isPending = profile?.status === 'pending';

  if (isPending) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <Card className="p-12 text-center space-y-8 border-none shadow-2xl shadow-amber-100 bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-amber-400" />
          <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-[32px] flex items-center justify-center mx-auto shadow-inner">
            <Clock className="w-12 h-12 animate-pulse" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Akun Menunggu Verifikasi</h1>
            <p className="text-slate-500 font-medium max-w-md mx-auto">
              Halo <span className="text-indigo-600 font-bold">{profile?.full_name}</span>, akun pengajar Anda sedang ditinjau oleh tim Super Admin.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <ShieldAlert className="w-5 h-5 text-amber-500 mb-2" />
              <p className="text-xs font-bold text-slate-900 mb-1">Keamanan Data</p>
              <p className="text-[10px] text-slate-500 leading-tight">Kami memverifikasi setiap pengajar untuk menjaga kualitas konten.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <CheckCircle className="w-5 h-5 text-emerald-500 mb-2" />
              <p className="text-xs font-bold text-slate-900 mb-1">Status: Pending</p>
              <p className="text-[10px] text-slate-500 leading-tight">Proses ini biasanya memakan waktu kurang dari 24 jam kerja.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <Activity className="w-5 h-5 text-indigo-500 mb-2" />
              <p className="text-xs font-bold text-slate-900 mb-1">Langkah Selanjutnya</p>
              <p className="text-[10px] text-slate-500 leading-tight">Anda akan mendapatkan akses penuh setelah verifikasi selesai.</p>
            </div>
          </div>

          <div className="pt-4">
            <Button variant="outline" onClick={() => window.location.reload()} className="h-12 px-8">
              Cek Status Verifikasi
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Real Dashboard for Verified Teachers
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard Pengajar</h1>
          <p className="text-slate-500 font-medium italic">Selamat datang kembali, mari bimbing siswa kita hari ini.</p>
        </div>
        <Button className="h-12 shadow-lg shadow-indigo-200">
          Buat Kelas Baru
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-white border-none shadow-xl shadow-slate-200/50 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Siswa</p>
            <p className="text-2xl font-black text-slate-900">128</p>
          </div>
        </Card>
        <Card className="p-6 bg-white border-none shadow-xl shadow-slate-200/50 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Kelas</p>
            <p className="text-2xl font-black text-slate-900">12</p>
          </div>
        </Card>
        {/* More stats... */}
      </div>

      {/* Placeholder for real charts/lists */}
      <Card className="h-64 flex items-center justify-center border-dashed border-2 border-slate-200 bg-transparent">
        <p className="text-slate-400 font-bold italic">Visualisasi Analitik Kelas sedang dikembangkan...</p>
      </Card>
    </div>
  );
};

export default TeacherDashboard;
