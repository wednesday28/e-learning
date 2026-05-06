import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Card, Button, Spinner } from '../../components/ui';
import { PlayCircle, ChevronLeft, Lock, BookOpen, ChevronRight, LayoutGrid } from 'lucide-react';

const PUBLIC_LEVELS = ['SD', 'SMP', 'SMA', 'SMK'];


const Learning = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [lesson, setLesson] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(true);
  const [levelName, setLevelName] = useState('');
  const [relatedLessons, setRelatedLessons] = useState<any[]>([]);


  const lessonId = searchParams.get('id');
  const levelId = searchParams.get('level');
  const subjectId = searchParams.get('subject');
  const moduleId = searchParams.get('module');

  useEffect(() => {
    if (lessonId) {
      fetchLesson(lessonId);
    } else if (moduleId) {
      fetchLessonsByModule(moduleId);
    } else if (subjectId) {
      fetchModulesBySubject(subjectId);
    } else if (levelId) {
      fetchSubjectsByLevel(levelId);
    } else {
      fetchInitialData();
    }
  }, [lessonId, levelId, subjectId, moduleId]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('levels').select('*');
    setSubjects(data || []); // Misnomer but used for top-level jenjang
    setIsLoading(false);
  };

  const fetchSubjectsByLevel = async (lId: string) => {
    setIsLoading(true);
    const { data } = await supabase.from('subjects').select('*').eq('level_id', lId);
    setSubjects(data || []);
    
    // Access Control for Subjects
    const { data: levelData } = await supabase.from('levels').select('name').eq('id', lId).single();
    if (levelData && !PUBLIC_LEVELS.includes(levelData.name)) {
      const { data: user } = await supabase.auth.getUser();
      if (user?.user) {
        const { data: enrollment } = await supabase
          .from('class_students')
          .select('id, classes!inner(level_id)')
          .eq('student_id', user.user.id)
          .eq('classes.level_id', lId)
          .maybeSingle();
        
        if (!enrollment) {
          setLevelName(levelData.name);
          setHasAccess(false);
        }
      }
    }
    setIsLoading(false);
  };


  const fetchModulesBySubject = async (sId: string) => {
    setIsLoading(true);
    const { data } = await supabase
      .from('modules')
      .select('*, subjects!inner(level_id, levels!inner(name))')
      .eq('subject_id', sId);

    
    if (data && data.length > 0) {
      const levelInfo = data[0].subjects.levels;
      if (!PUBLIC_LEVELS.includes(levelInfo.name)) {
        const { data: user } = await supabase.auth.getUser();
        const { data: enrollment } = await supabase
          .from('class_students')
          .select('id, classes!inner(level_id)')
          .eq('student_id', user.user?.id)
          .eq('classes.level_id', data[0].subjects.level_id)
          .maybeSingle();
        
        if (!enrollment) {
          setLevelName(levelInfo.name);
          setHasAccess(false);
        }
      }
    }
    setModules(data || []);
    setIsLoading(false);
  };


  const fetchLessonsByModule = async (mId: string) => {
    setIsLoading(true);
    const { data } = await supabase
      .from('lessons')
      .select('*, modules!inner(subjects!inner(level_id, levels!inner(name)))')
      .eq('module_id', mId);

    if (data && data.length > 0) {
      const levelInfo = data[0].modules.subjects.levels;
      if (!PUBLIC_LEVELS.includes(levelInfo.name)) {
        const { data: user } = await supabase.auth.getUser();
        const { data: enrollment } = await supabase
          .from('class_students')
          .select('id, classes!inner(level_id)')
          .eq('student_id', user.user?.id)
          .eq('classes.level_id', data[0].modules.subjects.level_id)
          .maybeSingle();
        
        if (!enrollment) {
          setLevelName(levelInfo.name);
          setHasAccess(false);
        }
      }
    }
    setLessons(data || []);
    setIsLoading(false);
  };


  const fetchLesson = async (id: string) => {
    setIsLoading(true);
    try {
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

      // Fetch related lessons in the same module
      const { data: related } = await supabase
        .from('lessons')
        .select('id, title')
        .eq('module_id', data.module_id)
        .neq('id', id)
        .limit(5);
      setRelatedLessons(related || []);


      // Access Control Check
      const { data: { user } } = await supabase.auth.getUser();
      if (user && !PUBLIC_LEVELS.includes(currentLevel)) {
        // Check if student is in ANY class that matches this lesson's level
        const { data: enrollments } = await supabase
          .from('class_students')
          .select('id, classes!inner(level_id)')
          .eq('student_id', user.id)
          .eq('classes.level_id', data.modules.subjects.level_id);
        
        if (!enrollments || enrollments.length === 0) {
          // Additional check: maybe it's explicitly assigned as a class_material
          const { data: explicitMaterial } = await supabase
            .from('class_materials')
            .select('id, class_id, class_students!inner(student_id)')
            .eq('file_url', id)
            .eq('class_students.student_id', user.id)
            .maybeSingle();

          if (!explicitMaterial) setHasAccess(false);
        }
      }

    } catch (err: any) {
      console.error('Error fetching lesson:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Spinner /></div>;

  // Browser Mode (Level -> Subject -> Module -> Lesson)
  if (!lessonId) {
    return (
      <div className="max-w-6xl mx-auto space-y-10 pb-20">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-slate-500">
            <ChevronLeft className="w-4 h-4 mr-2" /> Kembali
          </Button>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Eksplorasi Materi</h1>
        </div>

        {moduleId ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lessons.map(l => (
              <div key={l.id} onClick={() => navigate(`/learning?id=${l.id}`)}>
                <Card className="p-6 hover:border-indigo-500 cursor-pointer flex items-center justify-between group h-full">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <PlayCircle className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-700">{l.title}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </Card>
              </div>
            ))}
          </div>
        ) : subjectId ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {modules.map(m => (
              <div key={m.id} onClick={() => navigate(`/learning?subject=${subjectId}&module=${m.id}`)}>
                <Card className="p-8 hover:scale-105 transition-all cursor-pointer space-y-4 h-full">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                    <LayoutGrid className="w-6 h-6" />
                  </div>
                  <h3 className="font-black text-slate-900 text-lg">{m.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">{m.description || 'Klik untuk melihat daftar pelajaran.'}</p>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {subjects.map(s => (
              <div key={s.id} onClick={() => navigate(`/learning?${levelId ? `subject=${s.id}` : `level=${s.id}`}`)}>
                <Card className="p-8 text-center hover:bg-indigo-600 hover:text-white transition-all cursor-pointer group h-full">
                  <div className="w-16 h-16 bg-slate-50 rounded-3xl mx-auto mb-4 flex items-center justify-center text-indigo-600 group-hover:bg-white/20 group-hover:text-white">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <span className="font-black text-lg tracking-tight">{s.name}</span>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Access Denied Mode
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
          <Button variant="outline" onClick={() => navigate('/dashboard')} className="w-full h-12">
            Kembali ke Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  // Lesson Player Mode
  if (!lesson) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <h2 className="text-2xl font-black text-slate-900 mb-4">Materi Tidak Ditemukan</h2>
        <Button onClick={() => navigate(-1)}>Kembali</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-slate-500">
          <ChevronLeft className="w-4 h-4 mr-2" /> Kembali
        </Button>
        <span className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-xs font-black uppercase tracking-widest">
          {levelName} • {lesson.modules?.subjects?.name}
        </span>
      </div>

      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[40px] p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-40 -mt-40 blur-3xl" />
        <div className="relative z-10">
          <h2 className="text-4xl font-black tracking-tight leading-tight mb-4">{lesson.title}</h2>
          <p className="text-indigo-100 font-medium text-lg">Pahami materi ini dengan seksama untuk meningkatkan XP-mu!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-10">
            <h3 className="text-xl font-black mb-6 text-slate-900 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-600" /> Ringkasan Materi
            </h3>
            <div 
              className="prose prose-slate max-w-none text-slate-600 font-medium leading-relaxed text-lg"
              dangerouslySetInnerHTML={{ __html: lesson.content }}
            />
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card className="bg-indigo-600 text-white p-8 rounded-[32px] border-none shadow-xl shadow-indigo-200">
            <h4 className="font-black text-sm uppercase tracking-widest text-indigo-200 mb-6">Materi Lainnya</h4>
            <div className="space-y-4">
              {relatedLessons.length > 0 ? relatedLessons.map((l, idx) => (
                <div key={l.id} className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate(`/learning?id=${l.id}`)}>
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white font-bold group-hover:bg-white group-hover:text-indigo-600 transition-all">{idx + 1}</div>
                  <p className="text-sm font-bold opacity-80 group-hover:opacity-100 transition-opacity line-clamp-2">{l.title}</p>
                </div>
              )) : (
                <p className="text-sm font-medium text-indigo-200 italic">Tidak ada materi lain di modul ini.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Learning;
