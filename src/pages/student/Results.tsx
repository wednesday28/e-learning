
import { Card, Button } from '../../components/ui';
import { CheckCircle } from 'lucide-react';

const Results = () => (
  <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
    <div className="w-32 h-32 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-xl shadow-emerald-100">
      <CheckCircle className="w-16 h-16" />
    </div>
    <div>
      <h1 className="text-4xl font-black text-slate-900 tracking-tight">Skor Kamu: 850</h1>
      <p className="text-slate-500 font-medium mt-2">Selamat! Kamu melampaui 90% siswa lainnya.</p>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Card className="bg-slate-50 border-none shadow-none p-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Benar</p>
        <p className="text-3xl font-black text-emerald-600">8/10</p>
      </Card>
      <Card className="bg-slate-50 border-none shadow-none p-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Salah</p>
        <p className="text-3xl font-black text-rose-500">2/10</p>
      </Card>
    </div>
    <div className="space-y-3">
      <Button variant="outline" className="w-full h-12">Lihat Pembahasan</Button>
      <Button className="w-full h-12">Kembali ke Dashboard</Button>
    </div>
  </div>
);

export default Results;
