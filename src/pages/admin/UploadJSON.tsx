import { Card, Button } from '../../components/ui';
import { Upload, FileJson, AlertCircle } from 'lucide-react';

const UploadJSON = () => (
  <div className="max-w-2xl mx-auto space-y-8">
    <div className="text-center">
      <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sinkronisasi Kurikulum</h1>
      <p className="text-slate-500 font-medium">Unggah file JSON untuk memperbarui data Level, Grade, Subject, dan Module secara massal.</p>
    </div>

    <Card className="p-10 border-2 border-dashed border-slate-200 hover:border-indigo-500 transition-all cursor-pointer bg-slate-50/50">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center text-indigo-600">
          <FileJson className="w-10 h-10" />
        </div>
        <div>
          <p className="text-lg font-bold text-slate-900">Pilih File Kurikulum</p>
          <p className="text-sm text-slate-400">Pastikan format file sesuai dengan skema database.</p>
        </div>
        <Button className="px-10 h-12 text-base">
          <Upload className="w-5 h-5" /> Unggah Sekarang
        </Button>
      </div>
    </Card>

    <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 flex gap-4">
      <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
      <div>
        <p className="text-sm font-bold text-amber-900">Perhatian Sebelum Mengunggah</p>
        <p className="text-xs text-amber-700 leading-relaxed mt-1">Mengunggah data kurikulum baru akan menggantikan referensi data lama jika terdapat ID yang sama. Harap lakukan pencadangan database terlebih dahulu.</p>
      </div>
    </div>
  </div>
);

export default UploadJSON;
