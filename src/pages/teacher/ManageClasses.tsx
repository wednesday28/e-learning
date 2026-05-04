import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, Button, Spinner, Input } from '../../components/ui';
import { PlusCircle, Search, Filter, Users, GraduationCap, ChevronRight, School } from 'lucide-react';

const ManageClasses = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [newClassName, setNewClassName] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: clsData } = await supabase
        .from('classes')
        .select('*, subjects(name), class_enrollments(count)');
      
      setClasses(clsData || []);

      const { data: subData } = await supabase.from('subjects').select('*');
      setSubjects(subData || []);
    } catch (err) {
      console.error('Error fetching teacher data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClass = async () => {
    if (!newClassName || !selectedSubject) return;
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('classes').insert({
        name: newClassName,
        subject_id: selectedSubject,
        teacher_id: user?.id,
        invite_code: Math.random().toString(36).substring(2, 8).toUpperCase()
      });

      if (error) throw error;
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      console.error('Error creating class:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && classes.length === 0) return <div className="h-screen flex items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Manajemen Kelas</h1>
          <p className="text-slate-500 font-medium italic mt-2">Bangun komunitas belajarmu dan pantau progres siswa.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="h-14 px-8 rounded-2xl shadow-xl shadow-indigo-200">
          <PlusCircle className="w-5 h-5 mr-2" /> Buat Kelas Baru
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-indigo-600 text-white border-none space-y-4">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center"><School className="w-6 h-6" /></div>
          <div>
            <p className="text-4xl font-black">{classes.length}</p>
            <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest">Total Kelas</p>
          </div>
        </Card>
        <Card className="p-6 bg-slate-900 text-white border-none space-y-4">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center"><Users className="w-6 h-6" /></div>
          <div>
            <p className="text-4xl font-black">{classes.reduce((acc, curr) => acc + (curr.class_enrollments?.[0]?.count || 0), 0)}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Siswa Terdaftar</p>
          </div>
        </Card>
        <Card className="p-6 bg-emerald-600 text-white border-none space-y-4">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center"><GraduationCap className="w-6 h-6" /></div>
          <div>
            <p className="text-4xl font-black">85%</p>
            <p className="text-xs font-bold text-emerald-200 uppercase tracking-widest">Tingkat Kelulusan</p>
          </div>
        </Card>
      </div>

      <Card className="p-8">
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-300" />
            <Input placeholder="Cari berdasarkan nama kelas atau kode..." className="pl-12 h-12 bg-slate-50 border-transparent focus:bg-white focus:ring-indigo-500 rounded-2xl" />
          </div>
          <Button variant="secondary" className="h-12 px-6 rounded-2xl"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
        </div>

        <div className="space-y-4">
          {classes.length > 0 ? classes.map((cls) => (
            <div key={cls.id} className="flex items-center justify-between p-6 bg-white rounded-3xl border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-slate-100 transition-all group">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 font-black text-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  {cls.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg tracking-tight">{cls.name}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{cls.subjects?.name || 'Tanpa Pelajaran'}</p>
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{cls.invite_code}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right mr-4 hidden sm:block">
                  <p className="text-sm font-black text-slate-900">{cls.class_enrollments?.[0]?.count || 0} Siswa</p>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Aktif</p>
                </div>
                <Button variant="ghost" size="icon" className="rounded-xl"><ChevronRight className="w-5 h-5 text-slate-400" /></Button>
              </div>
            </div>
          )) : (
            <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
               <School className="w-16 h-16 text-slate-200 mx-auto mb-4" />
               <p className="text-slate-400 font-black text-lg">Belum ada kelas yang dibuat.</p>
               <Button variant="ghost" onClick={() => setShowCreateModal(true)} className="mt-4 text-indigo-600">Klik di sini untuk membuat kelas pertama Anda.</Button>
            </div>
          )}
        </div>
      </Card>

      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <Card className="w-full max-w-md p-10 space-y-8 animate-in zoom-in slide-in-from-bottom-10 duration-300">
            <div className="text-center">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Buat Kelas Baru</h2>
              <p className="text-slate-500 text-sm font-medium">Lengkapi detail kelas di bawah ini.</p>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Kelas</label>
                <Input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="Contoh: 10-A Matematika" className="h-14 bg-slate-50 border-none rounded-2xl" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mata Pelajaran</label>
                <select 
                  value={selectedSubject} 
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full h-14 bg-slate-50 border-none rounded-2xl px-4 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Pilih Mata Pelajaran...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <Button variant="ghost" onClick={() => setShowCreateModal(false)} className="flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest">Batal</Button>
                <Button onClick={handleCreateClass} className="flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200">Simpan Kelas</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ManageClasses;
