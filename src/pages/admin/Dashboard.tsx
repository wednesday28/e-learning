
import { Card, Button } from '../../components/ui';
import { Shield, Users, Upload, FileText, AlertTriangle } from 'lucide-react';

const AdminDashboard = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Control Center</h1>
          <p className="text-slate-500 font-medium">Manajemen sistem, pengguna, dan konten kurikulum.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-indigo-600">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Users</p>
          <p className="text-3xl font-black text-slate-900">2,450</p>
        </Card>
        <Card className="border-l-4 border-l-emerald-600">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Active Now</p>
          <p className="text-3xl font-black text-slate-900">124</p>
        </Card>
        <Card className="border-l-4 border-l-amber-600">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Storage Used</p>
          <p className="text-3xl font-black text-slate-900">45 GB</p>
        </Card>
        <Card className="border-l-4 border-l-rose-600">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Alerts</p>
          <p className="text-3xl font-black text-slate-900 text-rose-600">0</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <h3 className="font-black text-lg mb-6 flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-600" /> Bulk Import Kurikulum
          </h3>
          <div className="border-2 border-dashed border-slate-200 rounded-[16px] p-12 text-center space-y-4 hover:border-indigo-300 transition-colors cursor-pointer group">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto group-hover:bg-indigo-50 transition-colors">
              <FileText className="w-8 h-8 text-slate-300 group-hover:text-indigo-600" />
            </div>
            <p className="text-sm text-slate-500 font-medium">Seret file JSON ke sini atau klik untuk memilih file.</p>
            <Button variant="outline" size="sm">Pilih File</Button>
          </div>
        </Card>

        <Card>
          <h3 className="font-black text-lg mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> Aktivitas Terbaru
          </h3>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors border-b border-slate-50 last:border-none">
                <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">User baru terdaftar: Budi Doremi</p>
                  <p className="text-xs text-slate-400">Role: Siswa • 2 menit yang lalu</p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" className="w-full mt-4 text-xs font-bold text-indigo-600">Lihat Semua Aktivitas</Button>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
