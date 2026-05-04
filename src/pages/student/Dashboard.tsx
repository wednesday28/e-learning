import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Card, Button, Progress, Spinner } from '../../components/ui';
import { BookOpen, Trophy, Clock, Star, Play, ChevronRight, GraduationCap } from 'lucide-react';

const StudentDashboard = () => {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [levels, setLevels] = useState<any[]>([]);
  const [activeSubjects, setActiveSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Levels
      const { data: levelsData } = await supabase
        .from('levels')
        .select('*')
        .order('name');
      
      setLevels(levelsData || []);

      // 2. Fetch some subjects to show as "Pelajaran Aktif" (Simulated for now)
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select(`
          *,
          levels (name)
        `)
        .limit(3);
      
      setActiveSubjects(subjectsData || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-40 -mt-40 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest text-indigo-100">
              <Star className="w-3 h-3 fill-current" /> Level {Math.floor((profile?.total_xp || 0) / 1000) + 1}
            </div>
            <h1 className="text-4xl font-black tracking-tight leading-tight">
              Semangat Belajar,<br />{profile?.full_name?.split(' ')[0]}! 🚀
            </h1>
            <p className="text-indigo-100 font-medium text-lg max-w-md opacity-90">
              Siap untuk melanjutkan petualangan belajarmu hari ini?
            </p>
          </div>
          <div className="flex gap-6">
            <div className="bg-white/15 backdrop-blur-xl rounded-[32px] p-6 text-center min-w-[140px] border border-white/10">
              <p className="text-xs font-black text-indigo-200 uppercase tracking-widest mb-2">XP Saya</p>
              <p className="text-4xl font-black">{profile?.total_xp || 0}</p>
            </div>
            <div className="bg-white/15 backdrop-blur-xl rounded-[32px] p-6 text-center min-w-[140px] border border-white/10">
              <p className="text-xs font-black text-indigo-200 uppercase tracking-widest mb-2">Peringkat</p>
              <p className="text-4xl font-black">#--</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-12">
          
          {/* Jenkins Jenjang Pendidikan */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <GraduationCap className="w-8 h-8 text-indigo-600" /> Jenjang Pendidikan
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {levels.map((level) => (
                <div key={level.id} onClick={() => navigate(`/learning?level=${level.id}`)}>
                  <Card 
                    className="group hover:bg-indigo-600 hover:scale-105 transition-all duration-300 cursor-pointer border-none shadow-xl shadow-slate-100 p-8 flex flex-col items-center text-center space-y-4 h-full"
                  >
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-white/20 group-hover:text-white transition-colors">
                      <BookOpen className="w-8 h-8" />
                    </div>
                    <h3 className="font-black text-slate-900 group-hover:text-white text-lg tracking-tight">{level.name}</h3>
                  </Card>
                </div>
              ))}
            </div>
          </section>

          {/* Active Lessons */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <Play className="w-8 h-8 text-emerald-500" /> Lanjutkan Belajar
              </h2>
              <Button variant="ghost" size="sm" className="text-indigo-600 font-black tracking-widest uppercase text-xs">
                Lihat Semua <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              {activeSubjects.length > 0 ? activeSubjects.map((subject) => (
                <div key={subject.id} onClick={() => navigate(`/learning?subject=${subject.id}`)}>
                  <Card 
                    className="group hover:ring-2 hover:ring-indigo-500 transition-all cursor-pointer p-6"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-lg shadow-slate-200 group-hover:shadow-indigo-200`}>
                          <Star className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">{subject.levels?.name || 'General'}</p>
                          <h3 className="font-black text-slate-900 text-lg">{subject.name}</h3>
                        </div>
                      </div>
                      <Button size="icon" variant="secondary" className="rounded-2xl h-12 w-12 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                        <Play className="w-5 h-5 fill-current" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-widest">
                        <span>Progres Materi</span>
                        <span>0%</span>
                      </div>
                      <Progress value={0} className="h-3 rounded-full bg-slate-100" />
                    </div>
                  </Card>
                </div>
              )) : (
                <p className="text-slate-400 font-medium italic">Pilih jenjang pendidikan di atas untuk memulai.</p>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-10">
          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight flex items-center gap-3">
              <Trophy className="w-8 h-8 text-amber-500" /> Pencapaian
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              <Card className="p-6 flex items-center gap-5 border-none shadow-xl shadow-slate-100">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
                  <Star className="w-7 h-7 fill-current" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Streak Belajar</p>
                  <p className="text-xl font-black text-slate-900">0 Hari</p>
                </div>
              </Card>
              <Card className="p-6 flex items-center gap-5 border-none shadow-xl shadow-slate-100">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                  <Clock className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu Belajar</p>
                  <p className="text-xl font-black text-slate-900">0 Jam</p>
                </div>
              </Card>
            </div>
          </section>

          <Card className="bg-slate-900 rounded-[32px] p-8 text-white border-none shadow-2xl shadow-indigo-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-600/40 transition-colors" />
            <div className="relative z-10 space-y-6">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-black text-xl mb-2 tracking-tight">Siap Uji Nyali?</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">Selesaikan kuis hari ini untuk mendapatkan bonus 500 XP!</p>
              </div>
              <Button variant="secondary" className="w-full h-14 font-black tracking-widest uppercase text-xs" onClick={() => navigate('/quiz')}>
                Mulai Tantangan
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
