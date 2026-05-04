import { useState, useRef, useCallback } from 'react';
import { 
  Upload, FileJson, CheckCircle, 
  RotateCcw, Play, Loader2, List, Trash2, 
  ChevronRight, Terminal
} from 'lucide-react';
import { Card, Button, Progress } from '../../components/ui';

// ─── Types ───────────────────────────────────────────────────────────────────
interface CurriculumItem {
  level: string;
  grade: number;
  subject: string;
  topic: { name: string };
  lesson: { title: string };
  [key: string]: any;
}

interface LogMessage {
  type: 'info' | 'success' | 'error';
  message: string;
  timestamp: string;
}

type UploadStatus = 'idle' | 'validating' | 'ready' | 'uploading' | 'completed' | 'error';

// ─── Component ────────────────────────────────────────────────────────────────
const UploadCurriculum = () => {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<CurriculumItem[]>([]);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((type: LogMessage['type'], message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { type, message, timestamp }]);
    // Auto scroll logs
    setTimeout(() => {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  // ─── JSON Validation ────────────────────────────────────────────────────────
  const validateData = (jsonData: any[]): jsonData is CurriculumItem[] => {
    if (!Array.isArray(jsonData)) return false;
    
    for (let i = 0; i < jsonData.length; i++) {
      const item = jsonData[i];
      if (typeof item.level !== 'string' || item.level.trim() === '') return false;
      if (typeof item.grade !== 'number' || item.grade < 1 || item.grade > 12) return false;
      if (typeof item.subject !== 'string' || item.subject.trim() === '') return false;
      if (!item.topic || typeof item.topic.name !== 'string') return false;
      if (!item.lesson || typeof item.lesson.title !== 'string') return false;
    }
    return true;
  };

  const handleFile = async (selectedFile: File) => {
    if (selectedFile.type !== 'application/json' && !selectedFile.name.endsWith('.json')) {
      addLog('error', 'Format file harus .json');
      return;
    }

    setFile(selectedFile);
    setStatus('validating');
    addLog('info', `Membaca file: ${selectedFile.name}...`);

    try {
      const text = await selectedFile.text();
      const jsonData = JSON.parse(text);
      
      if (validateData(jsonData)) {
        setData(jsonData);
        setStatus('ready');
        setTotalBatches(Math.ceil(jsonData.length / 50));
        addLog('success', `Validasi berhasil: ${jsonData.length} item ditemukan.`);
      } else {
        setStatus('error');
        addLog('error', 'Struktur JSON tidak valid. Periksa skema data Anda.');
      }
    } catch (err) {
      setStatus('error');
      addLog('error', 'Gagal membaca file. Pastikan format JSON benar.');
    }
  };

  // ─── Drag & Drop Handlers ───────────────────────────────────────────────────
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  };

  // ─── Upload Logic ───────────────────────────────────────────────────────────
  const startUpload = async () => {
    setStatus('uploading');
    addLog('info', 'Memulai proses upload batch...');
    
    const chunkSize = 50;
    const batches = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      batches.push(data.slice(i, i + chunkSize));
    }

    let successCount = 0;
    for (let i = 0; i < batches.length; i++) {
      setCurrentBatch(i + 1);
      let retryCount = 0;
      let batchSuccess = false;

      while (retryCount <= 2 && !batchSuccess) {
        if (retryCount > 0) {
          addLog('info', `Mencoba ulang batch ${i + 1} (Percobaan ${retryCount})...`);
        } else {
          addLog('info', `Mengunggah batch ${i + 1}/${batches.length}...`);
        }

        try {
          const response = await fetch('/api/v1/lessons/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(batches[i])
          });

          if (response.ok) {
            batchSuccess = true;
            successCount++;
            addLog('success', `Batch ${i + 1} berhasil diunggah.`);
          } else {
            throw new Error(`Server error: ${response.status}`);
          }
        } catch (err: any) {
          retryCount++;
          if (retryCount > 2) {
            addLog('error', `Batch ${i + 1} gagal setelah 2 kali percobaan.`);
          }
        }
      }

      setProgress(Math.round(((i + 1) / batches.length) * 100));
    }

    setStatus('completed');
    addLog('success', `Upload selesai! ${successCount} batch berhasil diproses.`);
  };

  const resetState = () => {
    setFile(null);
    setData([]);
    setStatus('idle');
    setProgress(0);
    setCurrentBatch(0);
    setLogs([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <Upload className="text-white w-6 h-6" />
            </div>
            Bulk Curriculum Upload
          </h1>
          <p className="text-slate-500 font-medium mt-1">Impor data kurikulum secara massal via JSON dengan sistem batching pintar.</p>
        </div>
        {status !== 'idle' && (
          <Button variant="outline" onClick={resetState} className="text-rose-500 hover:text-rose-600">
            <RotateCcw className="w-4 h-4 mr-2" /> Reset & Mulai Ulang
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Upload & Progress */}
        <div className="lg:col-span-2 space-y-6">
          {status === 'idle' || status === 'error' ? (
            <div 
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                h-80 border-4 border-dashed rounded-[32px] flex flex-col items-center justify-center space-y-4 cursor-pointer transition-all
                ${isDragging ? 'border-indigo-500 bg-indigo-50 scale-[0.99]' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}
              `}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden" 
                accept=".json"
              />
              <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600 shadow-lg shadow-indigo-100">
                <FileJson className="w-10 h-10" />
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-slate-900">Drop file JSON di sini</p>
                <p className="text-sm text-slate-400 font-medium">Atau klik untuk memilih dari komputer</p>
              </div>
              <Button>Pilih File</Button>
            </div>
          ) : (
            <Card className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <FileJson className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{file?.name}</p>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">{(file?.size || 0) / 1000} KB • {data.length} Items</p>
                  </div>
                </div>
                {status === 'ready' && (
                  <Button onClick={startUpload} className="bg-emerald-500 hover:bg-emerald-600 h-12 px-8">
                    <Play className="w-5 h-5 mr-2 fill-current" /> Mulai Upload
                  </Button>
                )}
                {status === 'uploading' && (
                  <div className="flex items-center gap-2 text-indigo-600 font-black animate-pulse">
                    <Loader2 className="w-5 h-5 animate-spin" /> Sedang Memproses...
                  </div>
                )}
                {status === 'completed' && (
                  <div className="flex items-center gap-2 text-emerald-600 font-black">
                    <CheckCircle className="w-5 h-5" /> Selesai
                  </div>
                )}
              </div>

              {(status === 'uploading' || status === 'completed') && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-black text-slate-900">
                    <span className="flex items-center gap-2">
                      <List className="w-4 h-4 text-indigo-600" /> Progress Batch
                    </span>
                    <span>{currentBatch} / {totalBatches} ({progress}%)</span>
                  </div>
                  <Progress value={progress} className="h-4 rounded-full" />
                </div>
              )}

              {/* Preview Table */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="font-black text-slate-900 flex items-center gap-2">
                  <ChevronRight className="w-5 h-5 text-indigo-600" /> Preview (10 Data Pertama)
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      <tr>
                        <th className="px-4 py-3">Level</th>
                        <th className="px-4 py-3">Grade</th>
                        <th className="px-4 py-3">Subject</th>
                        <th className="px-4 py-3">Topic</th>
                        <th className="px-4 py-3">Lesson</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {data.slice(0, 10).map((item, idx) => (
                        <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-900">{item.level}</td>
                          <td className="px-4 py-3 font-bold text-slate-600">{item.grade}</td>
                          <td className="px-4 py-3 text-slate-600">{item.subject}</td>
                          <td className="px-4 py-3 text-slate-500">{item.topic.name}</td>
                          <td className="px-4 py-3 text-indigo-600 font-medium">{item.lesson.title}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right: Console Logs */}
        <Card className="bg-slate-900 text-white border-none flex flex-col overflow-hidden h-[600px] shadow-2xl">
          <div className="p-4 bg-slate-800 flex items-center justify-between border-b border-slate-700">
            <h3 className="font-bold flex items-center gap-2 text-indigo-400 text-sm">
              <Terminal className="w-4 h-4" /> Activity Log
            </h3>
            <button onClick={() => setLogs([])} className="text-slate-500 hover:text-white transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[11px] scrollbar-thin scrollbar-thumb-slate-700">
            {logs.length === 0 ? (
              <p className="text-slate-600 italic">Menunggu aktivitas...</p>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className={`flex gap-2 ${
                  log.type === 'error' ? 'text-rose-400' : 
                  log.type === 'success' ? 'text-emerald-400' : 'text-indigo-300'
                }`}>
                  <span className="text-slate-600">[{log.timestamp}]</span>
                  <span className="font-bold uppercase">[{log.type}]</span>
                  <span>{log.message}</span>
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UploadCurriculum;
