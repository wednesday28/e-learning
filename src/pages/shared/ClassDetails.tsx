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
  Award,
  BookOpen,
  Trash2,
  CheckCircle2,
  Sparkles
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
  const [teacherPackages, setTeacherPackages] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [assignType, setAssignType] = useState<'subject' | 'package'>('subject');
  const [isCatMode, setIsCatMode] = useState(false);
  const [materialSource, setMaterialSource] = useState<'upload' | 'bank'>('upload');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [bankModules, setBankModules] = useState<any[]>([]);
  const [bankLessons, setBankLessons] = useState<any[]>([]);

  // File Upload & AI Generation States
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadUrl, setUploadUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [autoGenerateQuiz, setAutoGenerateQuiz] = useState(true);



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
    }
  }, [id]);

  useEffect(() => {
    if (isTeacher && classData?.level_id) {
      fetchAvailableSubjects();
      fetchTeacherPackages();
    }
  }, [isTeacher, classData?.level_id]);



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
      .select('*, subjects(name), quiz_packages(title)')
      .eq('class_id', id);
    setClassQuizzes(data || []);
  };

  const fetchAvailableSubjects = async () => {
    const { data } = await supabase
      .from('subjects')
      .select('*, levels(name)')
      .order('level_id', { ascending: true })
      .order('name', { ascending: true });
    setAvailableSubjects(data || []);
  };

  const fetchTeacherPackages = async () => {
    const { data } = await supabase
      .from('quiz_packages')
      .select('*')
      .eq('teacher_id', profile?.id);
    setTeacherPackages(data || []);
  };

  const fetchBankModules = async (subjectId: string) => {
    const { data } = await supabase.from('modules').select('*').eq('subject_id', subjectId);
    setBankModules(data || []);
  };

  const fetchBankLessons = async (moduleId: string) => {
    const { data } = await supabase.from('lessons').select('*').eq('module_id', moduleId);
    setBankLessons(data || []);
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

  const generateQuizFromMaterial = async (materialId: string, title: string, fileUrl: string, file: File | null) => {
    setIsGeneratingQuiz(true);
    try {
      let questions = [];

      // If it's a parseable file, use the parsing API
      const isParseable = (file && (file.type === 'application/pdf' || file.name.endsWith('.docx') || file.name.endsWith('.pdf'))) || 
                         (fileUrl && (fileUrl.toLowerCase().endsWith('.pdf') || fileUrl.toLowerCase().endsWith('.docx')));

      if (isParseable) {
        const res = await fetch('/api/ai/parse-quiz-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileUrl,
            fileName: file?.name || fileUrl.split('/').pop(),
            fileType: file?.type || (fileUrl.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
          })
        });
        const data = await res.json();
        if (res.ok) questions = data.questions;
      }

      // Fallback to title-based generation if no questions extracted
      if (questions.length === 0) {
        const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
        if (!groqApiKey) return;

        const prompt = `Buatkan 5 soal pilihan ganda (A, B, C, D) dalam bahasa Indonesia tentang "${title}".
        Format wajib JSON array murni tanpa markdown:
        [{"question_text": "...", "choices": [{"text": "...", "is_correct": true}, ...]}]`;

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7
          })
        });
        const data = await res.json();
        const content = data.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
        questions = JSON.parse(content);
      }
      
      const questionIds = [];
      for (const q of questions) {
         const { data: qData, error: qError } = await supabase
           .from('questions')
           .insert({
             question_text: q.question_text,
             difficulty_level: q.difficulty_level || 'medium',
             type: 'multiple_choice',
             subject_id: availableSubjects[0]?.id || null
           })
           .select()
           .single();

         if (!qError && qData) {
            questionIds.push(qData.id);
            const choicesToInsert = q.choices.map((c: any) => ({
              question_id: qData.id,
              choice_text: c.text || c.choice_text,
              is_correct: c.is_correct
            }));
            await supabase.from('choices').insert(choicesToInsert);
         }
      }

      if (questionIds.length > 0) {
        await supabase
          .from('class_materials')
          .update({ generated_question_ids: questionIds })
          .eq('id', materialId);
        
        alert(`AI berhasil membuat ${questionIds.length} soal kuis dari materi "${title}"!`);
      }

    } catch (err) {
      console.error('AI Generation Error:', err);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handlePostMaterial = async () => {
    if (materialSource === 'upload' && !newMaterial.title) {
      alert('Judul materi harus diisi.');
      return;
    }
    if (materialSource === 'upload' && newMaterial.content_type !== 'link' && !uploadFile) {
      alert('Silakan pilih file untuk diunggah.');
      return;
    }
    if (materialSource === 'upload' && newMaterial.content_type === 'link' && !uploadUrl) {
      alert('Silakan masukkan URL.');
      return;
    }
    if (materialSource === 'bank' && !selectedLessonId) {
      alert('Silakan pilih materi dari bank.');
      return;
    }

    setIsUploading(true);
    let finalFileUrl = uploadUrl;

    try {
      // 1. Upload File if needed
      if (materialSource === 'upload' && uploadFile && newMaterial.content_type !== 'link') {
        const fileExt = uploadFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('class-materials')
          .upload(filePath, uploadFile);

        if (uploadError) {
          console.error('Storage Upload Error:', uploadError);
          throw new Error(`Gagal mengunggah file ke storage: ${uploadError.message}. Pastikan bucket 'class-materials' tersedia.`);
        }

        const { data: publicUrlData } = supabase.storage
          .from('class-materials')
          .getPublicUrl(filePath);
          
        finalFileUrl = publicUrlData.publicUrl;
      }

      // 2. Insert Material Record
      let payload: any = {
        class_id: id,
      };

      if (materialSource === 'bank') {
        const lesson = bankLessons.find(l => l.id === selectedLessonId);
        payload.title = lesson?.title || 'Materi Pelajaran';
        payload.content_type = 'lesson';
        payload.file_url = selectedLessonId;
      } else {
        payload.title = newMaterial.title;
        payload.content_type = newMaterial.content_type;
        payload.file_url = finalFileUrl;
        if (uploadFile) {
           payload.file_name = uploadFile.name;
           payload.file_size = uploadFile.size;
        }
      }

      const { data: newMaterialRecord, error: insertError } = await supabase
        .from('class_materials')
        .insert(payload)
        .select()
        .single();

      if (insertError) {
        console.error('Database Insert Error:', insertError);
        throw new Error(`Gagal menyimpan data materi ke database: ${insertError.message}.`);
      }

      // 3. Reset state & refresh
      setNewMaterial({ title: '', content_type: 'pdf' });
      setSelectedLessonId('');
      setUploadFile(null);
      setUploadUrl('');
      setShowCreateModal(false);
      fetchMaterials();

      // 4. Trigger AI Generation if enabled
      if (materialSource === 'upload' && uploadFile && autoGenerateQuiz) {
         generateQuizFromMaterial(newMaterialRecord.id, newMaterial.title, finalFileUrl, uploadFile);
      }

    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAssignQuiz = async () => {
    if (assignType === 'subject' && !selectedSubjectId) return;
    if (assignType === 'package' && !selectedPackageId) return;

    const { error } = await supabase.from('class_quizzes').insert({
      class_id: id,
      subject_id: assignType === 'subject' ? selectedSubjectId : null,
      package_id: assignType === 'package' ? selectedPackageId : null,
      teacher_id: profile?.id,
      is_cat_mode: isCatMode
    });
    if (!error) {
      setSelectedSubjectId('');
      setSelectedPackageId('');
      setShowCreateModal(false);
      fetchClassQuizzes();
    } else {
      alert('Gagal memberikan kuis: ' + error.message);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!window.confirm('Hapus kuis ini dari kelas?')) return;
    const { error } = await supabase.from('class_quizzes').delete().eq('id', quizId);
    if (!error) {
      fetchClassQuizzes();
    } else {
      alert('Gagal menghapus kuis: ' + error.message);
    }
  };


  if (id === 'null') {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-6">
        <Card className="p-10 border-rose-100 bg-rose-50/30">
          <h2 className="text-xl font-black text-slate-900">ID Kelas Tidak Valid</h2>
          <Button onClick={() => navigate('/dashboard')} className="w-full mt-6">Kembali ke Dashboard</Button>
        </Card>
      </div>
    );
  }

  if (isLoading && !classData) return <div className="h-screen flex items-center justify-center"><Spinner /></div>;

  if (!classData) return (
    <div className="max-w-md mx-auto py-20 text-center space-y-6">
      <Card className="p-10 border-slate-200">
        <h2 className="text-xl font-black text-slate-900">Kelas Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500 mt-2 font-medium">Kelas mungkin telah dihapus atau Anda tidak memiliki akses.</p>
        <Button onClick={() => navigate('/dashboard')} className="w-full mt-6">Ke Dashboard</Button>
      </Card>
    </div>
  );

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
                <div className="prose prose-slate max-w-none text-slate-600 font-medium whitespace-pre-wrap">
                  {a.content}
                </div>
              </Card>
            ))}
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
                      {m.profiles?.avatar_url ? <img src={m.profiles.avatar_url} alt="avatar" /> : m.profiles?.full_name?.[0]}
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
            {materials.map(m => {
              const isLesson = m.content_type === 'lesson';
              const getFullUrl = (url: string) => {
                if (!url || url.startsWith('http')) return url;
                const baseUrl = import.meta.env.VITE_SUPABASE_URL;
                return `${baseUrl}/storage/v1/object/public/class-materials/${url.replace(/^\/+/, '')}`;
              };
              const finalUrl = getFullUrl(m.file_url);

              return (
                <div key={m.id} className="relative group">
                  <Card 
                    onClick={() => isLesson ? navigate(`/learning?id=${m.file_url}`) : window.open(finalUrl, '_blank')}
                    className="p-6 flex flex-col items-center text-center space-y-4 hover:border-indigo-500 hover:shadow-xl hover:bg-slate-50/50 transition-all cursor-pointer group h-full"
                  >
                    <div className="w-16 h-16 bg-slate-50 group-hover:bg-white rounded-3xl flex items-center justify-center text-indigo-600 shadow-sm transition-all">
                      {isLesson ? <BookOpen className="w-8 h-8" /> : <FileIcon className="w-8 h-8" />}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900">{m.title}</h4>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{m.content_type || 'Dokumen'}</p>
                    </div>
                  </Card>
                  
                  {isTeacher && !isLesson && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          generateQuizFromMaterial(m.id, m.title, finalUrl, null);
                        }}
                        className="bg-white/80 backdrop-blur-sm border border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl text-[10px] font-black py-1 px-3 shadow-sm"
                      >
                        <Sparkles className="w-3 h-3 mr-1" /> Buat Kuis
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
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
                   {isTeacher && (
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteQuiz(q.id)} className="h-8 w-8 text-slate-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></Button>
                   )}
                </div>
                <div className="relative z-10">
                  <h4 className="text-xl font-black text-slate-900 mb-1">{q.quiz_packages?.title || q.subjects?.name}</h4>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{q.package_id ? 'Paket Tes' : 'Mata Pelajaran'}</p>
                </div>
                <Button 
                  onClick={() => navigate(`/quiz?${q.package_id ? `packageId=${q.package_id}` : `subjectId=${q.subject_id}`}`)}
                  className="w-full h-12 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-black shadow-lg relative z-10"
                >
                  Mulai Kerjakan Kuis
                </Button>
              </Card>
            ))}
          </div>
        )}
        
        {activeTab === 'students' && (
          <Card className="p-8">
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <Users className="w-6 h-6 text-indigo-600" /> Anggota Kelas ({students.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               {students.map(s => (
                 <div key={s.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-indigo-600">
                       {s.profiles?.full_name?.[0]}
                    </div>
                    <div>
                       <p className="font-black text-slate-900 leading-none">{s.profiles?.full_name}</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Siswa • {s.profiles?.total_xp || 0} XP</p>
                    </div>
                 </div>
               ))}
            </div>
          </Card>
        )}
      </div>

      {/* Create Content Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
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
                  <Input value={newAnnouncement.title} onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})} placeholder="Judul Pengumuman" className="h-14 rounded-2xl bg-slate-50 border-none px-4" />
                  <textarea value={newAnnouncement.content} onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})} className="w-full min-h-[120px] bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium" placeholder="Konten pengumuman..." />
                  <Button onClick={handlePostAnnouncement} className="w-full h-14 rounded-2xl shadow-lg">Posting Info</Button>
                </>
              )}

              {contentType === 'assignment' && (
                <>
                  <Input value={newAssignment.title} onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})} placeholder="Judul Tugas" className="h-14 rounded-2xl bg-slate-50 border-none px-4" />
                  <textarea value={newAssignment.instructions} onChange={(e) => setNewAssignment({...newAssignment, instructions: e.target.value})} className="w-full min-h-[120px] bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium" placeholder="Instruksi tugas..." />
                  <Input type="date" value={newAssignment.due_date} onChange={(e) => setNewAssignment({...newAssignment, due_date: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none px-4" />
                  <Button onClick={handlePostAssignment} className="w-full h-14 rounded-2xl shadow-lg">Posting Tugas</Button>
                </>
              )}

              {contentType === 'material' && (
                <>
                  <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
                    <button onClick={() => setMaterialSource('upload')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg ${materialSource === 'upload' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Upload File</button>
                    <button onClick={() => setMaterialSource('bank')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg ${materialSource === 'bank' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Bank Materi</button>
                  </div>

                  {materialSource === 'upload' ? (
                    <div className="space-y-4">
                       <Input value={newMaterial.title} onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})} placeholder="Judul Materi" className="h-14 rounded-2xl bg-slate-50 border-none px-4" />
                       <select value={newMaterial.content_type} onChange={(e) => setNewMaterial({...newMaterial, content_type: e.target.value})} className="w-full h-14 bg-slate-50 border-none rounded-2xl px-4 text-sm font-bold">
                          <option value="pdf">PDF Dokumen</option>
                          <option value="video">Video Materi</option>
                          <option value="link">Link Eksternal</option>
                       </select>
                       {newMaterial.content_type !== 'link' ? (
                          <div className="relative h-20 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center">
                             <input type="file" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                             <p className="text-sm text-slate-400 font-bold">{uploadFile ? uploadFile.name : 'Klik untuk pilih file'}</p>
                          </div>
                       ) : (
                          <Input value={uploadUrl} onChange={(e) => setUploadUrl(e.target.value)} placeholder="https://..." className="h-14 rounded-2xl bg-slate-50 border-none px-4" />
                       )}
                       
                       <div className="flex items-center gap-3 p-4 bg-indigo-50/50 rounded-2xl cursor-pointer" onClick={() => setAutoGenerateQuiz(!autoGenerateQuiz)}>
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${autoGenerateQuiz ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                             {autoGenerateQuiz && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          <div>
                            <p className="text-xs font-black text-indigo-900 flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Auto-Generate Kuis (AI)</p>
                            <p className="text-[10px] text-indigo-600 font-medium">Sistem akan otomatis membuat soal latihan dari materi ini.</p>
                          </div>
                       </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                       <select value={selectedSubjectId} onChange={(e) => { setSelectedSubjectId(e.target.value); fetchBankModules(e.target.value); }} className="w-full h-14 bg-slate-50 border-none rounded-2xl px-4 text-sm font-bold">
                          <option value="">Pilih Mata Pelajaran...</option>
                          {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.levels?.name})</option>)}
                       </select>
                       <select disabled={!selectedSubjectId} value={selectedModuleId} onChange={(e) => { setSelectedModuleId(e.target.value); fetchBankLessons(e.target.value); }} className="w-full h-14 bg-slate-50 border-none rounded-2xl px-4 text-sm font-bold">
                          <option value="">Pilih Modul...</option>
                          {bankModules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                       </select>
                       <select disabled={!selectedModuleId} value={selectedLessonId} onChange={(e) => setSelectedLessonId(e.target.value)} className="w-full h-14 bg-slate-50 border-none rounded-2xl px-4 text-sm font-bold">
                          <option value="">Pilih Materi...</option>
                          {bankLessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                       </select>
                    </div>
                  )}
                  <Button onClick={handlePostMaterial} disabled={isUploading} className="w-full h-14 rounded-2xl shadow-lg">
                    {isUploading ? <><Spinner className="mr-2" /> Menyimpan...</> : 'Posting Materi'}
                  </Button>
                  {isGeneratingQuiz && <p className="text-center text-[10px] font-bold text-amber-600 animate-pulse mt-2">AI sedang menyiapkan kuis otomatis...</p>}
                </>
              )}

              {contentType === 'quiz' && (
                <div className="space-y-4">
                   <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                      <button onClick={() => setAssignType('subject')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg ${assignType === 'subject' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Subjek</button>
                      <button onClick={() => setAssignType('package')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg ${assignType === 'package' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Paket Saya</button>
                   </div>
                   {assignType === 'subject' ? (
                      <select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} className="w-full h-14 bg-slate-50 border-none rounded-2xl px-4 text-sm font-bold">
                        <option value="">Pilih Subjek...</option>
                        {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.levels?.name})</option>)}
                      </select>
                   ) : (
                      <select value={selectedPackageId} onChange={(e) => setSelectedPackageId(e.target.value)} className="w-full h-14 bg-slate-50 border-none rounded-2xl px-4 text-sm font-bold">
                        <option value="">Pilih Paket...</option>
                        {teacherPackages.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                      </select>
                   )}
                   <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => setIsCatMode(!isCatMode)}>
                      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isCatMode ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                         {isCatMode && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">Aktifkan Mode Simulasi CAT</p>
                        <p className="text-[10px] text-slate-500 font-medium">Siswa akan mengerjakan kuis ini dengan antarmuka CAT.</p>
                      </div>
                    </div>
                   <Button onClick={handleAssignQuiz} className="w-full h-14 rounded-2xl shadow-lg">Berikan Kuis</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassDetails;
