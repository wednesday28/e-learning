
import { Card, Button } from '../../components/ui';
import { PlayCircle, ChevronLeft } from 'lucide-react';

const Learning = () => (
  <div className="max-w-4xl mx-auto space-y-6">
    <Button variant="ghost" className="mb-4">
      <ChevronLeft className="w-4 h-4 mr-2" /> Kembali
    </Button>
    <div className="aspect-video bg-slate-900 rounded-[24px] overflow-hidden flex items-center justify-center relative group cursor-pointer">
      <PlayCircle className="w-20 h-20 text-white opacity-50 group-hover:opacity-100 transition-all scale-100 group-hover:scale-110" />
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <h2 className="text-xl font-bold text-white">Video Pembelajaran: Pengenalan Aljabar</h2>
      </div>
    </div>
    <Card>
      <h3 className="text-xl font-black mb-4 tracking-tight">Materi: Aljabar Dasar</h3>
      <p className="text-slate-600 leading-relaxed font-medium">Aljabar adalah salah satu bagian dari bidang matematika yang luas, bersama-sama dengan teori bilangan, geometri dan analisis. Dalam bentuk paling umum, aljabar adalah studi tentang simbol-simbol matematika dan aturan untuk memanipulasi simbol-simbol ini.</p>
    </Card>
  </div>
);

export default Learning;
