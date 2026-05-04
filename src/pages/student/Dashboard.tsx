import React from 'react';
import { Card, Button, Progress } from '../../components/ui';
import { BookOpen, Trophy, Clock, Star, Play, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const StudentDashboard = () => {
  const { profile } = useAuthStore();

  const courses = [
    { title: 'Matematika: Aljabar', progress: 65, total: 12, completed: 8, color: 'bg-indigo-500' },
    { title: 'Fisika: Kinematika', progress: 30, total: 10, completed: 3, color: 'bg-emerald-500' },
    { title: 'Bahasa Inggris: Tenses', progress: 90, total: 15, completed: 14, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-indigo-600 rounded-[24px] p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-200">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight">Semangat Belajar, {profile?.full_name?.split(' ')[0]}! 🚀</h1>
            <p className="text-indigo-100 font-medium">Kamu sudah menyelesaikan 85% target minggu ini. Keren!</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 text-center min-w-[100px]">
              <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-1">XP Saya</p>
              <p className="text-2xl font-black">{profile?.total_xp || 1250}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 text-center min-w-[100px]">
              <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-1">Peringkat</p>
              <p className="text-2xl font-black">#4</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main: Active Courses */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-600" /> Pelajaran Aktif
            </h2>
            <Button variant="ghost" size="sm" className="text-indigo-600 font-bold">
              Lihat Semua <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {courses.map((course, idx) => (
              <Card key={idx} className="group hover:ring-2 hover:ring-indigo-500 transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${course.color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                      <Star className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{course.title}</h3>
                      <p className="text-xs text-slate-500">{course.completed}/{course.total} Materi Selesai</p>
                    </div>
                  </div>
                  <Button size="icon" variant="secondary" className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-4 h-4 fill-current" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-400">
                    <span>Progress</span>
                    <span>{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar: Activity & Stats */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-black text-slate-900 mb-6 tracking-tight flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-500" /> Pencapaian
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-100 text-center space-y-2">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Streak</p>
                <p className="text-lg font-black text-slate-900">12 Hari</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-100 text-center space-y-2">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <Clock className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Waktu</p>
                <p className="text-lg font-black text-slate-900">24 Jam</p>
              </div>
            </div>
          </div>

          <Card className="bg-indigo-900 text-white border-none shadow-xl shadow-indigo-200">
            <h3 className="font-black text-lg mb-2">Siap untuk Quiz?</h3>
            <p className="text-indigo-200 text-sm mb-6 font-medium">Uji pemahamanmu pada materi "Aljabar Linear" sekarang.</p>
            <Button variant="secondary" className="w-full">
              Mulai Quiz Sekarang
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
