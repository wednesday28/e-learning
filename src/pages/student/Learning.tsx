import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Card, Button, Spinner } from '../../components/ui';
import { PlayCircle, ChevronLeft, Lock, Users, ShieldAlert } from 'lucide-react';

const TEACHER_REQUIRED_LEVELS = ['CPNS', 'POLRI', 'Kedinasan', 'UTBK-SNBT'];

const Learning = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  
  const [lesson, setLesson] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(true);
  const [levelName, setLevelName] = useState('');

  const lessonId = searchParams.get('id');

  useEffect(() => {
    if (lessonId) {
      fetchLesson(lessonId);
    } else {
      setIsLoading(false);
    }
  }, [lessonId]);

  const fetchLesson = async (id: string) => {
    setIsLoading(true);
    try {
      // Get lesson with module and subject details
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          modules!inner (
            *,
            subjects!inner (
              *,
              levels!inner (*)
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      const currentLevel = data.modules.subjects.levels.name;
      setLevelName(currentLevel);
      setLesson(data);

      // Check if this level requires a teacher
      if (TEACHER_REQUIRED_LEVELS.includes(currentLevel)) {
        // For now, we check if student is in ANY class 
        // In a real app, we would check for a class specific to this subject
        const { data: classData } = await supabase
          .from('classes')
          .select('id')
          .limit(1); // Simple check: is there any class?
        
        // If no classes exist or student hasn't joined one (this is simplified)
        // We'll simulate that they need a teacher for these categories
        setHasAccess(false); 
      }
    } catch (err: any) {
      console.error('Error fetching lesson:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="h-64 flex items-center justify-center"><Spinner /></div>;

  if (!hasAccess) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card className="p-12 text-center space-y-6 border-2 border-rose-100 bg-rose-50/30">
          <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-rose-200">
            <Lock className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Akses Terbatas</h2>
            <p className="text-slate-500 mt-2 font-medium">
              Materi untuk kategori <span className="text-rose-600 font-bold">{levelName}</span> memerlukan bimbingan Guru resmi.
            </p>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-rose-100 text-sm text-slate-600 flex items-start gap-3 text-left">
            <Users className="w-5 h-5 text-indigo-500 shrink-0" />
            <p>Silakan hubungi administrator sekolah atau guru pembimbing Anda untuk mendaftarkan diri ke kelas <span className="font-bold">{levelName}</span> agar dapat mengakses materi ini.</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')} className="w-full h-12">
            Kembali ke Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  // Fallback for empty state
  if (!lesson) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <ShieldAlert className="w-16 h-16 text-slate-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-400">Pilih materi dari dashboard untuk mulai belajar.</h2>
        <Button onClick={() => navigate('/dashboard')} className="mt-6">Buka Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-slate-500">
          <ChevronLeft className="w-4 h-4 mr-2" /> Kembali
        </Button>
        <span className="px-4 py-1.5 bg-indigo-100 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest">
          {levelName} • {lesson.modules.subjects.name}
        </span>
      </div>

      <div className="aspect-video bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden flex items-center justify-center relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent pointer-events-none" />
        <PlayCircle className="w-24 h-24 text-white opacity-40 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 cursor-pointer shadow-2xl" />
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
          <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-2">Video Tutorial</p>
          <h2 className="text-2xl font-black text-white tracking-tight">{lesson.title}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-8">
            <h3 className="text-xl font-black mb-4 tracking-tight text-slate-900">Deskripsi Materi</h3>
            <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-relaxed">
              {lesson.content || 'Belum ada konten tertulis untuk materi ini.'}
            </div>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card className="bg-slate-900 text-white border-none p-6">
            <h4 className="font-black text-sm uppercase tracking-widest text-indigo-400 mb-4">Target Belajar</h4>
            <ul className="space-y-4">
              {[1, 2, 3].map(i => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i}</div>
                  <p className="text-sm text-slate-300">Point utama pembelajaran ke-{i} untuk topik ini.</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Learning;
