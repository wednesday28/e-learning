import { useState } from 'react';
import { Card, Button, Spinner } from '../../components/ui';
import { Upload, FileJson, CheckCircle2, AlertCircle, Trash2, CloudUpload } from 'lucide-react';

const UploadCurriculum = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [logs, setLogs] = useState<{ type: 'success' | 'error', message: string }[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setLogs([]);
    }
  };

  const processUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setLogs([{ type: 'success', message: 'Mulai memproses file...' }]);
    
    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      const items = Array.isArray(jsonData) ? jsonData : [jsonData];

      setLogs(prev => [...prev, { type: 'success', message: `Ditemukan ${items.length} item materi.` }]);

      // We'll use the API endpoint we created earlier
      const response = await fetch('/api/v1/lessons/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      });

      const result = await response.json();

      if (result.success) {
        setLogs(prev => [...prev, { 
          type: 'success', 
          message: `Berhasil mengunggah ${result.successCount} materi. ${result.errors.length} error.` 
        }]);
        if (result.errors.length > 0) {
          result.errors.forEach((err: any) => {
            setLogs(prev => [...prev, { type: 'error', message: `Error pada ${err.item}: ${err.error}` }]);
          });
        }
      } else {
        throw new Error(result.message || 'Gagal mengunggah data.');
      }
    } catch (err: any) {
      setLogs(prev => [...prev, { type: 'error', message: `Kritis: ${err.message}` }]);
    } finally {
      setIsUploading(false);
      setFile(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pusat Ingesti Kurikulum</h1>
        <p className="text-slate-500 font-medium italic">Unggah dataset JSON untuk memperbarui pustaka materi secara massal.</p>
      </div>

      <Card className="p-10 border-2 border-dashed border-slate-200 bg-slate-50/50 hover:border-indigo-400 transition-all group">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 bg-white rounded-[28px] shadow-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
            <CloudUpload className="w-10 h-10" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-900">Seret & Lepas File JSON</h3>
            <p className="text-sm text-slate-500 font-medium">Format: .json (Dataset Kurikulum Standar)</p>
          </div>

          <input 
            type="file" 
            accept=".json" 
            onChange={handleFileChange}
            className="hidden" 
            id="curriculum-upload" 
          />
          
          <div className="flex gap-4">
            <label 
              htmlFor="curriculum-upload" 
              className="cursor-pointer bg-white px-6 py-3 rounded-2xl border border-slate-200 font-black text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Pilih File
            </label>
            <Button 
              disabled={!file || isUploading} 
              onClick={processUpload}
              className="px-8 h-12 shadow-lg shadow-indigo-200"
            >
              {isUploading ? <Spinner className="w-4 h-4 mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
              Mulai Upload
            </Button>
          </div>

          {file && (
            <div className="flex items-center gap-3 px-4 py-2 bg-indigo-100 rounded-full text-indigo-700 text-xs font-black animate-in zoom-in">
              <FileJson className="w-4 h-4" />
              {file.name}
              <button onClick={() => setFile(null)}><Trash2 className="w-3 h-3 ml-1 hover:text-rose-500" /></button>
            </div>
          )}
        </div>
      </Card>

      {logs.length > 0 && (
        <Card className="bg-slate-900 text-white border-none p-8 space-y-4">
          <h3 className="font-black text-sm uppercase tracking-[0.2em] text-indigo-400">Log Aktivitas</h3>
          <div className="space-y-2 font-mono text-xs max-h-60 overflow-y-auto custom-scrollbar pr-4">
            {logs.map((log, i) => (
              <div key={i} className={`flex items-start gap-3 p-2 rounded ${log.type === 'error' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                {log.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                <span>{log.message}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default UploadCurriculum;
