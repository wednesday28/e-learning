
import { Card, Button } from '../../components/ui';
import { Users, BookMarked, PlusCircle, TrendingUp, Search } from 'lucide-react';

const TeacherDashboard = () => {
  const stats = [
    { label: 'Total Siswa', value: '156', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Kelas Aktif', value: '8', icon: BookMarked, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Rata-rata Nilai', value: '84.5', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Teacher Console</h1>
          <p className="text-slate-500 font-medium">Kelola kelas dan pantau perkembangan siswa Anda.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">Import Data</Button>
          <Button><PlusCircle className="w-4 h-4" /> Buat Kelas</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <Card key={idx} className="flex items-center gap-4">
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
              <stat.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-black text-lg">Daftar Kelas</h3>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Cari kelas..." className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
              <tr>
                <th className="px-4 py-3">Nama Kelas</th>
                <th className="px-4 py-3">Mata Pelajaran</th>
                <th className="px-4 py-3">Siswa</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[1, 2, 3, 4].map((item) => (
                <tr key={item} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4 font-bold text-slate-900">Kelas 10-A IPA</td>
                  <td className="px-4 py-4 text-slate-600">Matematika Dasar</td>
                  <td className="px-4 py-4">32 Siswa</td>
                  <td className="px-4 py-4 text-right">
                    <Button variant="ghost" size="sm" className="text-indigo-600 font-bold">Kelola</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default TeacherDashboard;
