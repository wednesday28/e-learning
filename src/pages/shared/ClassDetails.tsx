import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Card, Button, Spinner, Input } from '../../components/ui';
import { 
  ChevronLeft,
  Megaphone, 
  ClipboardList, 
  FileText, 
  MessagesSquare, 
  Users, 
  Clock, 
  PlusCircle, 
  Send,
  Download,
  X,
  FileIcon,
  ChevronRight,
  Award
} from 'lucide-react';


const ClassDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [classData, setClassData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Feature States
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  // Input States
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  const [newAssignment, setNewAssignment] = useState({ title: '', instructions: '', due_date: '' });
  const [newMaterial, setNewMaterial] = useState({ title: '', content_type: 'pdf' });
  const [newMessage, setNewMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [contentType, setContentType] = useState<'announcement' | 'assignment' | 'material' | 'quiz'>('announcement');
  const [classQuizzes, setClassQuizzes] = useState<any[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');




  const isTeacher = profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'super_admin';

  useEffect(() => {
    if (id) {
      fetchClassData();
      fetchAnnouncements();
      fetchAssignments();
      fetchMaterials();
      fetchMessages();
      fetchStudents();
      fetchClassQuizzes();
      if (isTeacher) fetchAvailableSubjects();
    }
  }, [id, profile]);


  const fetchClassData = async () => {
    const { data } = await supabase
      .from('classes')
      .select('*, levels(name), grades(grade_level)')
      .eq('id', id)
      .single();
    setClassData(data);
    setIsLoading(false);
  };

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from('class_announcements')
      .select('*')
      .eq('class_id', id)
      .order('created_at', { ascending: false });
    setAnnouncements(data || []);
  };

  const fetchAssignments = async () => {
    const { data } = await supabase
      .from('class_assignments')
      .select('*, class_submissions(count)')
      .eq('class_id', id)
      .order('created_at', { ascending: false });
    setAssignments(data || []);
  };

  const fetchMaterials = async () => {
    const { data } = await supabase
      .from('class_materials')
      .select('*')
      .eq('class_id', id)
      .order('created_at', { ascending: false });
    setMaterials(data || []);
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('class_messages')
      .select('*, profiles(full_name, avatar_url, role)')
      .eq('class_id', id)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('class_students')
      .select('*, profiles(*)')
      .eq('class_id', id);
    setStudents(data || []);
  };

  const fetchClassQuizzes = async () => {
    const { data } = await supabase
      .from('class_quizzes')
      .select('*, subjects(name)')
      .eq('class_id', id);
    setClassQuizzes(data || []);
  };

  const fetchAvailableSubjects = async () => {
    if (!classData?.level_id) return;
    const { data } = await supabase
      .from('subjects')
      .select('*')
      .eq('level_id', classData.level_id);
    setAvailableSubjects(data || []);
  };


  const handlePostAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) return;
    const { error } = await supabase.from('class_announcements').insert({
      class_id: id,
      teacher_id: profile?.id,
      title: newAnnouncement.title,
      content: newAnnouncement.content
    });

    if (!error) {
      setNewAnnouncement({ title: '', content: '' });
      setShowCreateModal(false);
      fetchAnnouncements();
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !profile?.id) return;
    const { error } = await supabase.from('class_messages').insert({
      class_id: id,
      user_id: profile.id,
      content: newMessage
    });

    if (!error) {
      setNewMessage('');
      fetchMessages();
    } else {
      alert('Gagal mengirim pesan: ' + error.message);
    }
  };

  const handlePostAssignment = async () => {
    if (!newAssignment.title || !newAssignment.instructions) return;
    const { error } = await supabase.from('class_assignments').insert({
      class_id: id,
      title: newAssignment.title,
      instructions: newAssignment.instructions,
      due_date: newAssignment.due_date || null
    });
    if (!error) {
      setNewAssignment({ title: '', instructions: '', due_date: '' });
      setShowCreateModal(false);
      fetchAssignments();
    } else {
      alert('Gagal posting tugas: ' + error.message);
    }
  };

  const handlePostMaterial = async () => {
    if (!newMaterial.title) return;
    const { error } = await supabase.from('class_materials').insert({
      class_id: id,
      title: newMaterial.title,
      content_type: newMaterial.content_type
    });
    if (!error) {
      setNewMaterial({ title: '', content_type: 'pdf' });
      setShowCreateModal(false);
      fetchMaterials();
    } else {
      alert('Gagal posting materi: ' + error.message);
    }
  };

  const handleAssignQuiz = async () => {
    if (!selectedSubjectId) return;
    const { error } = await supabase.from('class_quizzes').insert({
      class_id: id,
      subject_id: selectedSubjectId,
      teacher_id: profile?.id
    });
    if (!error) {
      setSelectedSubjectId('');
      setShowCreateModal(false);
      fetchClassQuizzes();
    } else {
      alert('Gagal memberikan kuis: ' + error.message);
    }
  };



  if (isLoading) return <div className="h-screen flex items-center justify-center"><Spinner /></div>;
  if (!classData) return <div className="p-20 text-center">Kelas tidak ditemukan.</div>;

  if (!classData) return <div className="p-20 text-center">Kelas tidak ditemukan.</div>;

  const tabs = [

    { id: 'overview', label: 'Ringkasan', icon: ClipboardList },
    { id: 'announcements', label: 'Pengumuman', icon: Megaphone },
    { id: 'assignments', label: 'Tugas', icon: FileText },
    { id: 'materials', label: 'Materi', icon: Download },
    { id: 'forum', label: 'Diskusi', icon: MessagesSquare },
    { id: 'quizzes', label: 'Kuis Kelas', icon: Award },
    { id: 'students', label: 'Siswa', icon: Users },
  ];


  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{classData.name}</h1>
            <p className="text-slate-500 font-medium">{classData.levels?.name} • Kode: <span className="font-bold text-indigo-600">{classData.join_code}</span></p>
          </div>
        </div>
        {isTeacher && (
          <div className="flex gap-3">
             <Button onClick={() => setShowCreateModal(true)} className="rounded-2xl h-12 px-6 shadow-lg shadow-indigo-100">
               <PlusCircle className="w-5 h-5 mr-2" /> Tambah Konten
             </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id 
              ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
              : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-8 md:col-span-2 space-y-6">
              <h3 className="text-xl font-black text-slate-900">Aktivitas Terkini</h3>
              <div className="space-y-4">
                {announcements.slice(0, 3).map(a => (
                  <div key={a.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-md">Pengumuman</span>
                      <span className="text-[10px] font-bold text-slate-400">{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-black text-slate-800">{a.title}</h4>
                    <p className="text-sm text-slate-500 line-clamp-2 mt-1">{a.content}</p>
                  </div>
                ))}
                {announcements.length === 0 && <p className="text-slate-400 italic text-center py-10">Belum ada aktivitas.</p>}
              </div>
            </Card>
            <div className="space-y-6">
              <Card className="p-8 bg-indigo-50 border-none">
                <h4 className="font-black text-slate-900 mb-4">Statistik Kelas</h4>
                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                     <span className="text-sm font-bold text-slate-500">Total Siswa</span>
                     <span className="font-black text-indigo-600">{students.length}</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-sm font-bold text-slate-500">Tugas Aktif</span>
                     <span className="font-black text-indigo-600">{assignments.length}</span>
                   </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="space-y-6">
            {announcements.map(a => (
              <Card key={a.id} className="p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-black">G</div>
                    <div>
                      <h4 className="font-black text-slate-900 leading-none">{a.title}</h4>
                      <p className="text-xs font-bold text-slate-400 mt-1">{new Date(a.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="prose prose-slate max-w-none text-slate-600 font-medium">
                  {a.content}
                </div>
              </Card>
            ))}
            {announcements.length === 0 && (
              <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                <Megaphone className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-black">Belum ada pengumuman.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assignments.map(a => (
              <Card key={a.id} className="p-8 space-y-6 hover:border-indigo-500 transition-all group">
                <div className="flex justify-between items-start">
                   <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                     <ClipboardList className="w-6 h-6" />
                   </div>
                   <div className="text-right">
                     <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-2 py-1 rounded-md flex items-center gap-1">
                       <Clock className="w-3 h-3" /> {a.due_date ? new Date(a.due_date).toLocaleDateString() : 'No Due'}
                     </span>
                   </div>
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-900 mb-2">{a.title}</h4>
                  <p className="text-sm text-slate-500 line-clamp-3">{a.instructions}</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-400">{isTeacher ? `${a.class_submissions?.[0]?.count || 0} Pengumpulan` : 'Belum Dikerjakan'}</span>
                  <Button variant="ghost" size="sm" className="text-indigo-600 font-black tracking-widest uppercase text-[10px]">Detail Tugas <ChevronRight className="w-4 h-4" /></Button>
                </div>
              </Card>
            ))}
            {assignments.length === 0 && (
              <div className="md:col-span-2 text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-black">Belum ada tugas.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'forum' && (
          <Card className="h-[600px] flex flex-col p-0 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <MessagesSquare className="w-6 h-6 text-indigo-600" />
              <h3 className="font-black text-slate-900">Diskusi Kelas</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50">
               {messages.map(m => (
                 <div key={m.id} className={`flex gap-4 ${m.user_id === profile?.id ? 'flex-row-reverse' : ''}`}>
                    <div className="w-10 h-10 bg-white rounded-full border border-slate-100 flex items-center justify-center font-black overflow-hidden flex-shrink-0">
                      {m.profiles?.avatar_url ? <img src={m.profiles.avatar_url} /> : m.profiles?.full_name?.[0]}
                    </div>
                    <div className={`max-w-[70%] space-y-1 ${m.user_id === profile?.id ? 'items-end' : ''}`}>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.profiles?.full_name}</p>
                       <div className={`p-4 rounded-2xl text-sm font-medium ${
                         m.user_id === profile?.id 
                         ? 'bg-indigo-600 text-white rounded-tr-none' 
                         : 'bg-white text-slate-700 rounded-tl-none shadow-sm'
                       }`}>
                         {m.content}
                       </div>
                       <p className="text-[9px] font-bold text-slate-300">{new Date(m.created_at).toLocaleTimeString()}</p>
                    </div>
                 </div>
               ))}
            </div>

            <div className="p-6 border-t border-slate-100 bg-white flex gap-4">
               <Input 
                 value={newMessage} 
                 onChange={(e) => setNewMessage(e.target.value)}
                 onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                 placeholder="Ketik pesan diskusi..." 
                 className="flex-1 h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-indigo-500" 
               />
               <Button onClick={handleSendMessage} className="h-12 w-12 p-0 rounded-xl">
                 <Send className="w-5 h-5" />
               </Button>
            </div>
          </Card>
        )}

        {activeTab === 'materials' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {materials.map(m => (
              <Card key={m.id} className="p-6 flex flex-col items-center text-center space-y-4 hover:border-indigo-500 transition-all cursor-pointer">
                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-indigo-600">
                  <FileIcon className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900">{m.title}</h4>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{m.content_type || 'Dokumen'}</p>
                </div>
                <Button variant="outline" className="w-full rounded-xl"><Download className="w-4 h-4 mr-2" /> Download</Button>
              </Card>
            ))}
            {materials.length === 0 && (
              <div className="md:col-span-3 text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                <Download className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-black">Belum ada materi eksklusif.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'quizzes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {classQuizzes.map(q => (
              <Card key={q.id} className="p-8 space-y-6 hover:border-amber-500 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-16 -mt-16 group-hover:bg-amber-100 transition-colors" />
                <div className="flex justify-between items-start relative z-10">
                   <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                     <Award className="w-6 h-6" />
                   </div>
                   <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-100">Kuis Kelas</span>
                </div>
                <div className="relative z-10">
                  <h4 className="text-xl font-black text-slate-900 mb-1">{q.subjects?.name}</h4>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Diberikan pada {new Date(q.assigned_at).toLocaleDateString()}</p>
                </div>
                <Button 
                  onClick={() => navigate(`/quiz?subjectId=${q.subject_id}`)}
                  className="w-full h-12 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-black shadow-lg relative z-10"
                >
                  Mulai Kerjakan Kuis
                </Button>
              </Card>
            ))}
            {classQuizzes.length === 0 && (
              <div className="md:col-span-2 text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                <Award className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-black">Belum ada kuis yang diberikan guru.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'students' && (

          <Card className="p-8">
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <Users className="w-6 h-6 text-indigo-600" /> Anggota Kelas ({students.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               {students.map(s => (
                 <div key={s.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all">
                    <div className="w-12 h-12 bg-white rounded-xl border border-slate-100 flex items-center justify-center font-black text-indigo-600">
                       {s.profiles?.full_name?.[0]}
                    </div>
                    <div>
                       <p className="font-black text-slate-900 leading-none">{s.profiles?.full_name}</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Siswa • {s.profiles?.total_xp} XP</p>
                    </div>
                 </div>
               ))}
            </div>
          </Card>
        )}
      </div>

      {/* Create Content Modal (Simplified for now) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-slate-900">Tambah Konten</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowCreateModal(false)} className="rounded-full">
                <X className="w-6 h-6" />
              </Button>
            </div>
            
            <div className="flex gap-2 mb-8 bg-slate-50 p-1.5 rounded-2xl">
               {(['announcement', 'assignment', 'material', 'quiz'] as const).map(type => (
                 <button
                   key={type}
                   onClick={() => setContentType(type)}
                   className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                     contentType === type ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'
                   }`}
                 >
                   {type === 'announcement' ? 'Info' : type === 'assignment' ? 'Tugas' : type === 'material' ? 'Materi' : 'Kuis'}
                 </button>
               ))}
            </div>


            <div className="space-y-6">
              {contentType === 'announcement' && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Judul</label>
                    <Input value={newAnnouncement.title} onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})} placeholder="Contoh: Info Ujian Tengah Semester" className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Konten</label>
                    <textarea 
                      value={newAnnouncement.content} 
                      onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                      className="w-full min-h-[120px] bg-slate-50 border-transparent rounded-2xl p-4 font-medium text-slate-900 focus:ring-indigo-500 focus:bg-white"
                      placeholder="Ketik pengumuman di sini..."
                    />
                  </div>
                  <Button onClick={handlePostAnnouncement} className="w-full h-14 rounded-2xl shadow-xl shadow-indigo-100">
                    Posting Pengumuman
                  </Button>
                </>
              )}

              {contentType === 'assignment' && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Judul Tugas</label>
                    <Input value={newAssignment.title} onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})} placeholder="Contoh: Latihan Aljabar Dasar" className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Instruksi</label>
                    <textarea 
                      value={newAssignment.instructions} 
                      onChange={(e) => setNewAssignment({...newAssignment, instructions: e.target.value})}
                      className="w-full min-h-[120px] bg-slate-50 border-transparent rounded-2xl p-4 font-medium text-slate-900 focus:ring-indigo-500 focus:bg-white"
                      placeholder="Ketik instruksi tugas di sini..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Batas Waktu (Opsional)</label>
                    <Input type="date" value={newAssignment.due_date} onChange={(e) => setNewAssignment({...newAssignment, due_date: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-indigo-500" />
                  </div>
                  <Button onClick={handlePostAssignment} className="w-full h-14 rounded-2xl shadow-xl shadow-indigo-100">
                    Posting Tugas
                  </Button>
                </>
              )}

              {contentType === 'material' && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Judul Materi</label>
                    <Input value={newMaterial.title} onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})} placeholder="Contoh: Modul Rumus Cepat Matematika" className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Tipe Materi</label>
                    <select 
                      value={newMaterial.content_type} 
                      onChange={(e) => setNewMaterial({...newMaterial, content_type: e.target.value})}
                      className="w-full h-14 bg-slate-50 border-transparent rounded-2xl px-4 font-bold text-slate-900 focus:ring-indigo-500 focus:bg-white"
                    >
                      <option value="pdf">PDF / Dokumen</option>
                      <option value="video">Link Video</option>
                      <option value="link">Link Eksternal</option>
                    </select>
                  </div>
                  <Button onClick={handlePostMaterial} className="w-full h-14 rounded-2xl shadow-xl shadow-indigo-100">
                    Posting Materi
                  </Button>
                </>
              )}

              {contentType === 'quiz' && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Pilih Mata Pelajaran Kuis</label>
                    <select 
                      value={selectedSubjectId} 
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="w-full h-14 bg-slate-50 border-transparent rounded-2xl px-4 font-bold text-slate-900 focus:ring-indigo-500 focus:bg-white"
                    >
                      <option value="">Pilih Subjek...</option>
                      {availableSubjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 font-medium px-2 italic">Hanya menampilkan mata pelajaran sesuai jenjang kelas ini.</p>
                  </div>
                  <Button onClick={handleAssignQuiz} className="w-full h-14 rounded-2xl shadow-xl shadow-indigo-100">
                    Berikan Kuis ke Kelas
                  </Button>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ClassDetails;
