import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, Button, Progress, Spinner } from '../../components/ui';
import { ChevronLeft, Timer, Award, BookOpen, ChevronRight, Target } from 'lucide-react';

import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';


const RESTRICTED_LEVELS = ['CPNS', 'POLRI', 'Kedinasan', 'UTBK-SNBT'];


const Quiz = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { profile } = useAuthStore();
  const [step, setStep] = useState<'selection' | 'class-selection' | 'class-assignments' | 'quiz' | 'result'>('selection');
  const [levels, setLevels] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  
  const [userClasses, setUserClasses] = useState<any[]>([]);
  const [classAssignments, setClassAssignments] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState(0);


  useEffect(() => {
    fetchInitialData();
    
    // Check for subjectId or packageId in URL to auto-start quiz
    const params = new URLSearchParams(location.search);
    const subjectId = params.get('subjectId');
    const packageId = params.get('packageId');
    
    if (subjectId) {
      startQuiz(subjectId, 'subject');
    } else if (packageId) {
      startQuiz(packageId, 'package');
    }
  }, [location.search]);



  const fetchInitialData = async () => {
    const { data } = await supabase.from('levels').select('*');
    let filteredLevels = data || [];
    
    // If student, filter out restricted levels from public view
    if (profile?.role === 'student') {
      filteredLevels = filteredLevels.filter(l => !RESTRICTED_LEVELS.includes(l.name));
    }
    
    setLevels(filteredLevels);
    setIsLoading(false);
  };


  const fetchSubjects = async (lId: string) => {
    setIsLoading(true);
    setSelectedLevel(lId);
    const { data } = await supabase.from('subjects').select('*').eq('level_id', lId);
    setSubjects(data || []);
    setIsLoading(false);
  };

  const startQuiz = async (id: string, type: 'subject' | 'package' = 'subject') => {
    setIsLoading(true);
    try {
      let qData: any[] = [];
      
      if (type === 'subject') {
        const { data } = await supabase
          .from('questions')
          .select('*, choices (*)')
          .eq('subject_id', id)
          .limit(10);
        qData = data || [];
      } else {
        const { data } = await supabase
          .from('quiz_package_questions')
          .select('questions(*, choices(*))')
          .eq('package_id', id)
          .order('order_index', { ascending: true });
        qData = data?.map(d => d.questions) || [];
      }

      if (!qData || qData.length === 0) {
        alert('Tidak ada soal ditemukan.');
        return;
      }
      setQuestions(qData);
      setStep('quiz');
    } catch (err) {
      console.error('Error starting quiz:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserClasses = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('class_students')
      .select('*, classes(*)')
      .eq('student_id', profile?.id);
    setUserClasses(data?.map(d => d.classes) || []);
    setStep('class-selection');
    setIsLoading(false);
  };

  const fetchClassAssignments = async (cls: any) => {
    setIsLoading(true);
    setSelectedClass(cls);
    const { data } = await supabase
      .from('class_quizzes')
      .select('*, subjects(name), quiz_packages(title, description)')
      .eq('class_id', cls.id);
    setClassAssignments(data || []);
    setStep('class-assignments');
    setIsLoading(false);
  };


  const handleAnswer = (choiceId: string) => {
    setAnswers({ ...answers, [questions[currentIndex].id]: choiceId });
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      calculateResult();
    }
  };

  const calculateResult = () => {
    let correctCount = 0;
    questions.forEach(q => {
      const selectedChoiceId = answers[q.id];
      const correctChoice = q.choices.find((c: any) => c.is_correct);
      if (selectedChoiceId === correctChoice?.id) {
        correctCount++;
      }
    });
    setScore(Math.round((correctCount / questions.length) * 100));
    setStep('result');
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Spinner /></div>;

  if (step === 'class-selection') {
    return (
      <div className="max-w-4xl mx-auto space-y-10 py-10">
        <div className="flex items-center gap-4">
           <Button variant="ghost" onClick={() => setStep('selection')} className="rounded-full">
             <ChevronLeft className="w-6 h-6" />
           </Button>
           <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pilih Kelas Kamu</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {userClasses.map(cls => (
             <div key={cls.id} onClick={() => fetchClassAssignments(cls)}>
                <Card className="p-8 flex items-center gap-6 hover:border-indigo-500 cursor-pointer group shadow-xl">
                   <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl">
                     {cls.name[0]}
                   </div>
                   <div>
                     <h3 className="text-xl font-black text-slate-900">{cls.name}</h3>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Ketuk untuk lihat kuis</p>
                   </div>
                </Card>
             </div>
           ))}
           {userClasses.length === 0 && <p className="col-span-full text-center py-20 text-slate-400 italic">Kamu belum terdaftar di kelas manapun.</p>}
        </div>
      </div>
    );
  }

  if (step === 'class-assignments') {
    return (
      <div className="max-w-4xl mx-auto space-y-10 py-10">
        <div className="flex items-center gap-4">
           <Button variant="ghost" onClick={() => setStep('class-selection')} className="rounded-full">
             <ChevronLeft className="w-6 h-6" />
           </Button>
           <div>
             <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tugas Kuis: {selectedClass?.name}</h1>
             <p className="text-slate-500 font-medium italic">Pilih kuis yang ingin kamu kerjakan.</p>
           </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {classAssignments.map(as => (
             <div key={as.id} onClick={() => startQuiz(as.package_id || as.subject_id, as.package_id ? 'package' : 'subject')}>
                <Card className="p-8 space-y-6 hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-12 -mt-12 group-hover:bg-amber-500 transition-colors" />
                   <div className="relative z-10">
                     <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white transition-colors">
                        <Award className="w-6 h-6" />
                     </div>
                     <h3 className="text-xl font-black text-slate-900">{as.quiz_packages?.title || as.subjects?.name}</h3>
                     <p className="text-sm text-slate-500 font-medium line-clamp-2 mt-2">{as.quiz_packages?.description || 'Latihan mata pelajaran reguler.'}</p>
                     <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{as.package_id ? 'Paket Tes' : 'Mata Pelajaran'}</span>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                     </div>
                   </div>
                </Card>
             </div>
           ))}
           {classAssignments.length === 0 && <p className="col-span-full text-center py-20 text-slate-400 italic">Belum ada tugas kuis di kelas ini.</p>}
        </div>
      </div>
    );
  }

  if (step === 'selection') {
    return (
      <div className="max-w-4xl mx-auto space-y-10 py-10">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Pusat Latihan Kuis</h1>
          <p className="text-slate-500 font-medium text-lg italic">Uji pemahamanmu dan raih XP maksimal!</p>
        </div>

        {!selectedLevel ? (
          <div className="space-y-10">
            {profile?.role === 'student' && (
               <div onClick={fetchUserClasses}>
                 <Card className="p-10 border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer group rounded-[40px] flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform shadow-xl">
                      <Target className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black mb-2 tracking-tight">Kuis dari Kelas Saya</h3>
                    <p className="text-sm font-medium opacity-70">Akses tugas kuis dan paket tes yang diberikan oleh gurumu.</p>
                 </Card>
               </div>
            )}

            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] text-center">Latihan Publik</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {levels.map(l => (
                  <div key={l.id} onClick={() => fetchSubjects(l.id)}>
                    <Card className="p-8 text-center hover:bg-indigo-600 hover:text-white transition-all cursor-pointer group shadow-xl shadow-slate-100 h-full">
                      <div className="w-16 h-16 bg-indigo-50 rounded-3xl mx-auto mb-4 flex items-center justify-center text-indigo-600 group-hover:bg-white/20 group-hover:text-white">
                        <Award className="w-8 h-8" />
                      </div>
                      <span className="font-black text-lg tracking-tight">{l.name}</span>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>

        ) : (
          <div className="space-y-6">
             <Button variant="ghost" onClick={() => setSelectedLevel(null)} className="text-slate-500">
              <ChevronLeft className="w-4 h-4 mr-2" /> Kembali ke Jenjang
            </Button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjects.map(s => (
                <div key={s.id} onClick={() => startQuiz(s.id)}>
                  <Card className="p-6 flex items-center justify-between hover:border-indigo-500 cursor-pointer group shadow-lg shadow-slate-50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <span className="font-black text-slate-800">{s.name}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }


  if (step === 'quiz') {
    const q = questions[currentIndex];
    return (
      <div className="max-w-3xl mx-auto space-y-8 py-10">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Kuis Berjalan</h2>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.2em]">Pertanyaan {currentIndex + 1} dari {questions.length}</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-2xl font-black text-sm">
            <Timer className="w-4 h-4 text-amber-400" /> 14:59
          </div>
        </div>

        <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-3 rounded-full bg-slate-100" />

        <Card className="p-8 space-y-8 shadow-2xl shadow-indigo-100/50">
          <p className="text-2xl font-black text-slate-800 leading-tight">{q.question_text}</p>
          <div className="grid grid-cols-1 gap-4">
            {q.choices.map((choice: any) => (
              <button 
                key={choice.id} 
                onClick={() => handleAnswer(choice.id)}
                className={`p-6 rounded-2xl border-2 text-left font-black transition-all transform active:scale-95 ${
                  answers[q.id] === choice.id 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg shadow-indigo-100' 
                    : 'border-slate-100 hover:border-indigo-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 ${
                    answers[q.id] === choice.id ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200'
                  }`}>
                    {String.fromCharCode(65 + q.choices.indexOf(choice))}
                  </div>
                  {choice.text}
                </div>
              </button>
            ))}
          </div>
          <Button 
            onClick={nextQuestion} 
            disabled={!answers[q.id]}
            className="w-full h-14 text-lg font-black shadow-xl shadow-indigo-200"
          >
            {currentIndex < questions.length - 1 ? 'Pertanyaan Berikutnya' : 'Selesaikan Kuis'}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-20 text-center space-y-10">
      <div className="relative inline-block">
        <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 animate-pulse" />
        <Card className="p-12 relative z-10 space-y-6 rounded-[48px] border-none shadow-2xl shadow-indigo-200">
          <div className="w-24 h-24 bg-indigo-600 text-white rounded-[32px] flex items-center justify-center mx-auto shadow-xl">
            <Award className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Skor Akhir Kamu</h2>
            <p className="text-6xl font-black text-indigo-600">{score}%</p>
          </div>
          <div className="flex justify-center gap-8 py-4 border-y border-slate-100">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Benar</p>
              <p className="text-xl font-black text-emerald-500">{(score / 100) * questions.length}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">XP Diperoleh</p>
              <p className="text-xl font-black text-amber-500">+{score * 10}</p>
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <Button onClick={() => setStep('selection')} variant="outline" className="flex-1 h-12">Main Lagi</Button>
            <Button onClick={() => navigate('/dashboard')} className="flex-1 h-12">Ke Dashboard</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Quiz;
