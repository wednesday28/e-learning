import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, Button, Spinner, Input } from '../../components/ui';
import { PlusCircle, BookOpen, Clock, Target, Calendar } from 'lucide-react';

const ManageQuizzes = () => {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: qzData } = await supabase
        .from('quizzes')
        .select('*, subjects(name)')
        .order('created_at', { ascending: false });
      
      setQuizzes(qzData || []);

      const { data: subData } = await supabase.from('subjects').select('*');
      setSubjects(subData || []);
    } catch (err) {
      console.error('Error fetching quiz data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateQuiz = async () => {
    if (!title || !selectedSubject) {
      alert('Mohon isi judul dan pilih mata pelajaran.');
      return;
    }
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('quizzes').insert({
        title,
        description,
        subject_id: selectedSubject,
        teacher_id: user?.id,
        status: 'published'
      });

      if (error) throw error;
      
      alert('Kuis berhasil dibuat!');
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setSelectedSubject('');
      fetchData();
    } catch (err: any) {
      alert('Gagal membuat kuis: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && quizzes.length === 0) return <div className="h-screen flex items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Daftar Quiz</h1>
          <p className="text-slate-500 font-medium italic mt-2">Kelola evaluasi pembelajaran dan ukur pemahaman siswa.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="h-14 px-8 rounded-2xl shadow-xl shadow-indigo-200">
          <PlusCircle className="w-5 h-5 mr-2" /> Buat Quiz Baru
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.length > 0 ? quizzes.map((q) => (
          <Card key={q.id} className="p-6 hover:shadow-2xl hover:shadow-indigo-100 transition-all border-none bg-white group">
            <div className="flex justify-between items-start mb-6">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-black rounded-full uppercase tracking-widest">{q.status}</span>
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                <Calendar className="w-3 h-3" /> {new Date(q.created_at).toLocaleDateString('id-ID')}
              </div>
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{q.title}</h3>
            <p className="text-sm text-slate-500 mb-8 line-clamp-2 font-medium">{q.description || 'Tidak ada deskripsi.'}</p>
            
            <div className="flex items-center gap-4 py-4 border-t border-slate-50">
              <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                <Target className="w-3.5 h-3.5" /> {q.subjects?.name}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-auto">
                <Clock className="w-3.5 h-3.5" /> 15m
              </div>
            </div>
            
            <Button variant="secondary" className="w-full mt-4 h-12 rounded-xl text-xs font-black uppercase tracking-widest bg-slate-50 text-slate-600 hover:bg-indigo-600 hover:text-white transition-all border-none">Edit Kuis</Button>
          </Card>
        )) : (
          <div className="col-span-full text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
             <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
             <p className="text-slate-400 font-black text-lg">Belum ada kuis yang dibuat.</p>
             <Button variant="ghost" onClick={() => setShowCreateModal(true)} className="mt-4 text-indigo-600">Buat kuis pertama Anda sekarang.</Button>
          </div>
        )}
      </div>

      {/* Create Quiz Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <Card className="w-full max-w-md p-10 space-y-8 animate-in zoom-in slide-in-from-bottom-10 duration-300">
            <div className="text-center">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Buat Quiz Baru</h2>
              <p className="text-slate-500 text-sm font-medium">Lengkapi detail kuis di bawah ini.</p>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul Kuis</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Kuis Matematika Dasar" className="h-14 bg-slate-50 border-none rounded-2xl" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Tentang apa kuis ini..." 
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none h-32"
                />
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
                <Button onClick={handleCreateQuiz} className="flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200">Simpan Kuis</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ManageQuizzes;
