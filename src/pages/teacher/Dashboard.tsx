import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, Button } from '../../components/ui';
import { useAuthStore } from '../../store/useAuthStore';
import { ShieldAlert, Clock, CheckCircle, Users, BookOpen, Activity, TrendingUp } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

const TeacherDashboard = () => {
  const { profile } = useAuthStore();
  const [stats, setStats] = useState({ totalStudents: 0, totalClasses: 0, avgScore: 85 });
  const [isLoading, setIsLoading] = useState(true);
  const isPending = profile?.status === 'pending';

  const activityData = [
    { name: 'Sen', visits: 45 },
    { name: 'Sel', visits: 52 },
    { name: 'Rab', visits: 38 },
    { name: 'Kam', visits: 65 },
    { name: 'Jum', visits: 48 },
    { name: 'Sab', visits: 24 },
    { name: 'Min', visits: 18 },
  ];

  const performanceData = [
    { range: '0-20', count: 5 },
    { range: '21-40', count: 12 },
    { range: '41-60', count: 25 },
    { range: '61-80', count: 45 },
    { range: '81-100', count: 32 },
  ];

  useEffect(() => {
    if (!isPending) fetchData();
  }, [isPending]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get classes count
      const { count: classCount } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', user?.id);

      // Get total students across all classes
      const { data: classes } = await supabase
        .from('classes')
        .select('id')
        .eq('teacher_id', user?.id);
      
      const classIds = classes?.map(c => c.id) || [];
      
      const { count: studentCount } = await supabase
        .from('class_students')
        .select('*', { count: 'exact', head: true })
        .in('class_id', classIds);

      setStats({
        totalClasses: classCount || 0,
        totalStudents: studentCount || 0,
        avgScore: 82 // This would normally be calculated from quiz results
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    const data = [
      ['Statistik', 'Nilai'],
      ['Total Siswa', stats.totalStudents],
      ['Total Kelas', stats.totalClasses],
      ['Rata-rata Skor', `${stats.avgScore}%`],
      ['Engagement', '92%']
    ];
    
    const csvContent = data.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `laporan_dashboard_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isPending) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <Card className="p-12 text-center space-y-8 border-none shadow-2xl shadow-amber-100 bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-amber-400" />
          <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-[32px] flex items-center justify-center mx-auto shadow-inner">
            <Clock className="w-12 h-12 animate-pulse" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Akun Menunggu Verifikasi</h1>
            <p className="text-slate-500 font-medium max-w-md mx-auto">
              Halo <span className="text-indigo-600 font-bold">{profile?.full_name}</span>, akun pengajar Anda sedang ditinjau oleh tim Super Admin.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <ShieldAlert className="w-5 h-5 text-amber-500 mb-2" />
              <p className="text-xs font-bold text-slate-900 mb-1">Keamanan Data</p>
              <p className="text-[10px] text-slate-500 leading-tight">Kami memverifikasi setiap pengajar untuk menjaga kualitas konten.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <CheckCircle className="w-5 h-5 text-emerald-500 mb-2" />
              <p className="text-xs font-bold text-slate-900 mb-1">Status: Pending</p>
              <p className="text-[10px] text-slate-500 leading-tight">Proses ini biasanya memakan waktu kurang dari 24 jam kerja.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <Activity className="w-5 h-5 text-indigo-500 mb-2" />
              <p className="text-xs font-bold text-slate-900 mb-1">Langkah Selanjutnya</p>
              <p className="text-[10px] text-slate-500 leading-tight">Anda akan mendapatkan akses penuh setelah verifikasi selesai.</p>
            </div>
          </div>

          <div className="pt-4">
            <Button variant="outline" onClick={() => window.location.reload()} className="h-12 px-8">
              Cek Status Verifikasi
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Dashboard Pengajar</h1>
          <p className="text-slate-500 font-medium italic">Selamat datang kembali, mari bimbing siswa kita hari ini.</p>
        </div>
        <div className="flex gap-3">
           <Button variant="outline" onClick={() => alert('Laporan lengkap sedang disiapkan...')} className="h-12 rounded-xl">Laporan Lengkap</Button>
           <Button onClick={handleDownload} className="h-12 shadow-lg shadow-indigo-200 rounded-xl">Download Data</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-white border-none shadow-xl shadow-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Siswa</p>
            <p className="text-3xl font-black text-slate-900">{isLoading ? '...' : stats.totalStudents}</p>
          </div>
        </Card>
        <Card className="p-6 bg-white border-none shadow-xl shadow-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Kelas</p>
            <p className="text-3xl font-black text-slate-900">{isLoading ? '...' : stats.totalClasses}</p>
          </div>
        </Card>
        <Card className="p-6 bg-white border-none shadow-xl shadow-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rata-rata Skor</p>
            <p className="text-3xl font-black text-slate-900">{stats.avgScore}%</p>
          </div>
        </Card>
        <Card className="p-6 bg-indigo-600 text-white border-none shadow-xl shadow-indigo-200 flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest">Engagement</p>
            <p className="text-3xl font-black">92%</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-8 border-none shadow-xl shadow-slate-100 bg-white">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Aktivitas Siswa (Minggu Ini)</h3>
            <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase">
              <TrendingUp className="w-4 h-4" /> +12% dari minggu lalu
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px'}}
                  itemStyle={{fontWeight: 'black', fontSize: '12px', color: '#6366f1'}}
                />
                <Area type="monotone" dataKey="visits" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorVisits)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-8 border-none shadow-xl shadow-slate-100 bg-white">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Distribusi Performa</h3>
            <select className="bg-slate-50 border-none rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 outline-none">
              <option>Semua Kuis</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} />
                <Tooltip 
                   cursor={{fill: '#f8fafc'}}
                   contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px'}}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {performanceData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 3 ? '#6366f1' : '#e2e8f0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TeacherDashboard;
