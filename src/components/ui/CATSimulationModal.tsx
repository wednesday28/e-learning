import React, { useState, useEffect } from 'react';
import { Timer, CheckSquare, Square, Flag, AlertCircle, PlayCircle } from 'lucide-react';
import { Button } from './index';

interface CATSimulationModalProps {
  questions: any[];
  title: string;
  durationMinutes: number;
  onFinish: (answers: Record<string, string>) => void;
  onClose: () => void;
}

export const CATSimulationModal: React.FC<CATSimulationModalProps> = ({
  questions,
  title,
  durationMinutes,
  onFinish,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    let timer: any;
    if (hasStarted && timeLeft > 0 && !showConfirm) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            onFinish(answers);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [hasStarted, timeLeft, showConfirm, answers, onFinish]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (choiceId: string) => {
    setAnswers({ ...answers, [questions[currentIndex].id]: choiceId });
  };

  const toggleFlag = () => {
    const newFlagged = new Set(flagged);
    if (newFlagged.has(currentIndex)) {
      newFlagged.delete(currentIndex);
    } else {
      newFlagged.add(currentIndex);
    }
    setFlagged(newFlagged);
  };

  if (!hasStarted) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl text-center space-y-6">
           <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
             <AlertCircle className="w-10 h-10" />
           </div>
           <div>
             <h2 className="text-3xl font-black text-slate-900 mb-2">Simulasi CAT BKN</h2>
             <p className="text-slate-500 font-medium">Ujian: <span className="font-bold text-indigo-600">{title}</span></p>
           </div>
           
           <div className="bg-slate-50 rounded-2xl p-6 text-left space-y-3">
              <h3 className="font-bold text-slate-800">Petunjuk Pengerjaan:</h3>
              <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
                <li>Waktu ujian adalah {durationMinutes} menit. Timer tidak akan berhenti.</li>
                <li>Jumlah soal sebanyak {questions.length} butir.</li>
                <li>Gunakan tombol navigasi atau grid nomor di sebelah kanan layar.</li>
                <li>Gunakan tombol <strong>Ragu-ragu</strong> jika Anda belum yakin dengan jawaban.</li>
                <li>Klik <strong>Selesai Ujian</strong> jika semua soal telah dikerjakan.</li>
              </ul>
           </div>

           <div className="flex gap-4 pt-4 border-t border-slate-100">
             <Button variant="ghost" onClick={onClose} className="flex-1 h-12">Kembali</Button>
             <Button onClick={() => setHasStarted(true)} className="flex-1 h-12 bg-indigo-600 text-white shadow-lg shadow-indigo-200">
               <PlayCircle className="w-5 h-5 mr-2" /> Mulai Simulasi
             </Button>
           </div>
        </div>
      </div>
    );
  }

  const q = questions[currentIndex];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-8 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-black">CAT</div>
          <div className="hidden sm:block">
            <h1 className="font-black text-slate-900 tracking-tight leading-none">{title}</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Simulasi Ujian</p>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
             <Timer className={`w-5 h-5 ${timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
             <div className={`text-xl sm:text-2xl font-black ${timeLeft < 300 ? 'text-rose-600' : 'text-slate-900'} tracking-tighter w-24 text-right`}>
               {formatTime(timeLeft)}
             </div>
          </div>
          <Button 
            onClick={() => setShowConfirm(true)} 
            className="h-10 px-6 bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200 rounded-xl"
          >
            Selesai Ujian
          </Button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* Soal Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col">
          <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
            <div className="bg-white rounded-[24px] sm:rounded-[32px] p-6 sm:p-10 shadow-xl shadow-slate-100/50 flex-1 flex flex-col border border-slate-100">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                 <h2 className="text-xl sm:text-2xl font-black text-slate-900">Soal No. {currentIndex + 1}</h2>
              </div>
              
              <div className="text-lg sm:text-xl font-bold text-slate-800 leading-relaxed mb-10 whitespace-pre-wrap">
                {q.question_text}
              </div>

              <div className="space-y-4 mb-8">
                {q.choices?.map((choice: any, idx: number) => {
                  const isSelected = answers[q.id] === choice.id;
                  const letter = String.fromCharCode(65 + idx);
                  return (
                    <button
                      key={choice.id}
                      onClick={() => handleAnswer(choice.id)}
                      className={`w-full p-4 sm:p-5 rounded-2xl border-2 text-left transition-all flex items-start gap-4 ${
                        isSelected 
                          ? 'border-indigo-600 bg-indigo-50 shadow-md shadow-indigo-100/50' 
                          : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                       <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-black shrink-0 ${
                         isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 text-slate-500'
                       }`}>
                         {letter}
                       </div>
                       <div className={`pt-1 font-semibold ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                         {choice.text}
                       </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between gap-2 sm:gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                  className="h-12 px-4 sm:px-8 rounded-xl font-bold"
                >
                  Sebelumnya
                </Button>
                <Button 
                  onClick={toggleFlag}
                  className={`h-12 px-4 sm:px-8 rounded-xl font-bold border-2 flex items-center gap-2 transition-all ${
                    flagged.has(currentIndex) 
                      ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-200' 
                      : 'bg-white border-amber-200 text-amber-600 hover:bg-amber-50'
                  }`}
                >
                  <Flag className="w-4 h-4" /> Ragu-ragu
                </Button>
                <Button 
                  onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
                  disabled={currentIndex === questions.length - 1}
                  className="h-12 px-4 sm:px-8 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Navigasi Grid (Desktop & Mobile Panel) */}
        <div className="w-full lg:w-80 bg-white border-l border-slate-200 lg:h-full shrink-0 flex flex-col shadow-xl z-20 h-64 lg:h-auto overflow-hidden rounded-t-3xl lg:rounded-none mt-auto lg:mt-0">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-black text-slate-800 text-sm tracking-tight">Navigasi Soal</h3>
            <div className="flex gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
               <div className="flex items-center gap-1"><Square className="w-3 h-3 text-emerald-500 fill-emerald-500" /> Dijawab</div>
               <div className="flex items-center gap-1"><Square className="w-3 h-3 text-amber-500 fill-amber-500" /> Ragu</div>
               <div className="flex items-center gap-1"><Square className="w-3 h-3 text-slate-200 fill-slate-200" /> Kosong</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-5 sm:grid-cols-10 lg:grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isFlagged = flagged.has(idx);
                const isActive = currentIndex === idx;
                
                let bgColor = 'bg-white border-slate-200 text-slate-600 hover:border-slate-400';
                if (isFlagged) bgColor = 'bg-amber-400 border-amber-500 text-white shadow-sm shadow-amber-200';
                else if (isAnswered) bgColor = 'bg-emerald-500 border-emerald-600 text-white shadow-sm shadow-emerald-200';
                
                if (isActive) bgColor += ' ring-4 ring-indigo-200 ring-offset-1 border-indigo-600 scale-110 z-10';

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 sm:h-12 rounded-xl border-2 font-black text-sm transition-all flex items-center justify-center ${bgColor}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-8 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
               <CheckSquare className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Selesai Ujian?</h3>
              <p className="text-slate-500 font-medium text-sm">
                Pastikan Anda telah memeriksa kembali seluruh jawaban. Waktu tersisa: <strong className="text-rose-600">{formatTime(timeLeft)}</strong>
              </p>
              
              <div className="mt-4 flex gap-2 justify-center text-xs font-bold text-slate-400">
                 <span className="text-emerald-500">{Object.keys(answers).length} Dijawab</span> • 
                 <span className="text-rose-500">{questions.length - Object.keys(answers).length} Kosong</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setShowConfirm(false)} className="flex-1">Batal</Button>
              <Button onClick={() => onFinish(answers)} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200">
                Akhiri Tes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
