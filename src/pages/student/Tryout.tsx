
import { Card, Button } from '../../components/ui';

const Tryout = () => (
  <div className="space-y-8">
    <h1 className="text-3xl font-black tracking-tight text-slate-900">Tryout Nasional</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="flex flex-col hover:shadow-lg transition-shadow">
          <div className="h-40 bg-indigo-50 rounded-xl mb-4 flex items-center justify-center">
            <span className="text- indigo-300 font-black text-4xl">TO #{i}</span>
          </div>
          <h3 className="font-bold text-lg mb-1 text-slate-900">Tryout UTBK-SNBT #{i}</h3>
          <p className="text-xs text-slate-500 mb-6 font-medium">Materi: TPS, Literasi Bahasa, Penalaran Matematika.</p>
          <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
            <span className="text-sm font-bold text-slate-400">120 Menit</span>
            <Button size="sm" variant="secondary">Ikuti Sekarang</Button>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

export default Tryout;
