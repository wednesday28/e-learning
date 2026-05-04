
import { Card, Button } from '../../components/ui';
import { PlusCircle, Search, Filter, MoreVertical } from 'lucide-react';

const ManageClasses = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manajemen Kelas</h1>
      <Button><PlusCircle className="w-4 h-4" /> Buat Kelas Baru</Button>
    </div>
    <Card>
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Cari berdasarkan nama kelas..." className="pl-9 pr-4 py-2 w-full bg-slate-50 border border-slate-100 rounded-lg text-sm" />
        </div>
        <Button variant="outline"><Filter className="w-4 h-4" /> Filter</Button>
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-indigo-200 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">10{i}</div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Kelas 10-A IPA {i}</h3>
                <p className="text-xs text-slate-500">Mata Pelajaran: Matematika • 32 Siswa</p>
              </div>
            </div>
            <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

export default ManageClasses;
