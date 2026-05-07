import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, Button, Spinner, Input } from '../../components/ui';
import { PlusCircle, BookOpen, Target, Search, CheckCircle2, Trash2, ChevronLeft, Upload, AlertCircle, X } from 'lucide-react';

import { useAuthStore } from '../../store/useAuthStore';

const ManageQuizzes = () => {
  const { profile } = useAuthStore();
  const [packages, setPackages] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'list' | 'create'>('list');

  // Create/Edit State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<any[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // AI Parsing States
  const [isParsing, setIsParsing] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [aiQuestionCount, setAiQuestionCount] = useState(10);
  const [aiPackageTitle, setAiPackageTitle] = useState('');

  useEffect(() => {
    fetchPackages();
    fetchLevels();
    fetchAllSubjects();
  }, []);

  const fetchAllSubjects = async () => {
    const { data } = await supabase.from('subjects').select('*, levels(name)');
    setAllSubjects(data || []);
  };

  const fetchPackages = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('quiz_packages')
      .select('*, levels(name)')
      .eq('teacher_id', profile?.id)
      .order('created_at', { ascending: false });
    setPackages(data || []);
    setIsLoading(false);
  };

  const fetchLevels = async () => {
    const { data } = await supabase.from('levels').select('*');
    setLevels(data || []);
  };

  const fetchSubjects = async (levelId: string) => {
    const { data } = await supabase.from('subjects').select('*').eq('level_id', levelId);
    setSubjects(data || []);
  };

  const fetchQuestions = async (subjectId: string) => {
    setIsLoading(true);
    const { data } = await supabase
      .from('questions')
      .select('*, choices(*)')
      .eq('subject_id', subjectId);
    setAvailableQuestions(data || []);
    setIsLoading(false);
  };

  const handleCreatePackage = async () => {
    if (!title || !selectedLevelId || selectedQuestionIds.length === 0) {
      alert('Mohon lengkapi judul, jenjang, dan pilih minimal 1 soal.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Insert Package
      const { data: pkg, error: pkgError } = await supabase.from('quiz_packages').insert({
        teacher_id: profile?.id,
        title,
        description,
        level_id: selectedLevelId
      }).select().single();

      if (pkgError) throw pkgError;

      // 2. Insert Questions
      const questionLinks = selectedQuestionIds.map((qId, index) => ({
        package_id: pkg.id,
        question_id: qId,
        order_index: index
      }));

      const { error: linkError } = await supabase.from('quiz_package_questions').insert(questionLinks);
      if (linkError) throw linkError;

      alert('Paket Kuis berhasil dibuat!');
      resetForm();
      fetchPackages();
      setView('list');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePackage = async (pkgId: string) => {
    if (!window.confirm('Hapus paket kuis ini?')) return;
    try {
      const { error } = await supabase.from('quiz_packages').delete().eq('id', pkgId);
      if (error) throw error;
      setPackages(prev => prev.filter(p => p.id !== pkgId));
    } catch (err: any) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedLevelId('');
    setSelectedSubjectId('');
    setSelectedQuestionIds([]);
    setAvailableQuestions([]);
  };

  const toggleQuestion = (id: string) => {
    if (selectedQuestionIds.includes(id)) {
      setSelectedQuestionIds(selectedQuestionIds.filter(q => q !== id));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, id]);
    }
  };

  const handleFileUpload = async (file: File | undefined) => {
    if (!file) return;
    
    setIsParsing(true);
    setUploadProgress(10);
    
    try {
      // 1. Upload to temporary storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `temp-quiz-uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('class-materials')
        .upload(filePath, file);

      if (uploadError) throw uploadError;
      setUploadProgress(40);

      const { data: { publicUrl } } = supabase.storage
        .from('class-materials')
        .getPublicUrl(filePath);

      // 2. Call parsing API
      const res = await fetch('/api/ai/parse-quiz-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: publicUrl,
          fileName: file.name,
          fileType: file.type,
          questionCount: aiQuestionCount
        })
      });

      const data = await res.json();
      setUploadProgress(90);

      if (!res.ok) throw new Error(data.message || 'Gagal memproses file');

      setParsedQuestions(data.questions || []);
      setShowPreviewModal(true);
      
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsParsing(false);
      setUploadProgress(0);
    }
  };

  const saveParsedQuestions = async () => {
    if (!selectedSubjectId || parsedQuestions.length === 0) {
      alert('Pilih Mata Pelajaran terlebih dahulu.');
      return;
    }
    
    setIsLoading(true);
    try {
      const insertedQuestionIds = [];
      
      // 1. Bulk insert questions
      for (const q of parsedQuestions) {
        const { data: qData, error: qError } = await supabase
          .from('questions')
          .insert({
            question_text: q.question_text,
            difficulty_level: q.difficulty_level || 'medium',
            type: 'multiple_choice',
            subject_id: selectedSubjectId
          })
          .select()
          .single();
          
        if (qError) throw qError;
        
        // 2. Insert choices
        const choices = q.choices.map((c: any) => ({
          question_id: qData.id,
          text: c.text,
          is_correct: c.is_correct
        }));
        
        const { error: cError } = await supabase.from('choices').insert(choices);
        if (cError) throw cError;
        
        insertedQuestionIds.push(qData.id);
      }

      // 3. Create Package automatically
      const { data: pkg, error: pkgError } = await supabase.from('quiz_packages').insert({
        teacher_id: profile?.id,
        title: aiPackageTitle || `Hasil Scan: ${new Date().toLocaleDateString()}`,
        description: `Dibuat otomatis dari file "${title || 'dokumen'}".`,
        level_id: allSubjects.find(s => s.id === selectedSubjectId)?.level_id || levels[0]?.id
      }).select().single();

      if (pkgError) throw pkgError;

      // 4. Link questions
      const links = insertedQuestionIds.map((id, index) => ({
        package_id: pkg.id,
        question_id: id,
        order_index: index
      }));
      await supabase.from('quiz_package_questions').insert(links);

      alert(`Berhasil menyimpan ${insertedQuestionIds.length} soal dan membuat paket baru!`);
      setShowPreviewModal(false);
      fetchPackages();
      
    } catch (err: any) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && view === 'list') return <div className="h-screen flex items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      {view === 'list' ? (
        <>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Paket Tes Saya</h1>
              <p className="text-slate-500 font-medium italic mt-2">Buat paket soal kustom dari bank soal yang tersedia.</p>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <input 
                  type="file" 
                  accept=".pdf,.docx,.json,.txt"
                  onChange={(e) => handleFileUpload(e.target.files?.[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  disabled={isParsing}
                />
                <Button variant="outline" className="h-14 px-8 rounded-2xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 shadow-sm" disabled={isParsing}>
                  {isParsing ? <Spinner className="w-5 h-5 mr-2" /> : <Upload className="w-5 h-5 mr-2" />}
                  Upload Kuis (PDF/Word)
                </Button>
              </div>
              <select 
                value={aiQuestionCount} 
                onChange={(e) => setAiQuestionCount(parseInt(e.target.value))}
                className="h-14 px-4 rounded-2xl border border-indigo-200 text-indigo-600 bg-white font-bold text-sm"
              >
                <option value={5}>5 Soal</option>
                <option value={10}>10 Soal</option>
                <option value={15}>15 Soal</option>
                <option value={20}>20 Soal</option>
              </select>
              <Button onClick={() => setView('create')} className="h-14 px-8 rounded-2xl shadow-xl shadow-indigo-200">
                <PlusCircle className="w-5 h-5 mr-2" /> Buat Paket Baru
              </Button>
            </div>
          </div>

          {isParsing && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 flex items-center gap-6 animate-in fade-in slide-in-from-top-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                 <Spinner className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-black text-indigo-900">AI sedang membaca file Anda...</p>
                <p className="text-sm text-indigo-600 font-medium">Ini mungkin memakan waktu 10-20 detik tergantung ukuran file.</p>
                <div className="w-full bg-indigo-200 h-1.5 rounded-full mt-3 overflow-hidden">
                   <div className="bg-indigo-600 h-full transition-all duration-500" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="p-8 hover:shadow-2xl hover:shadow-indigo-100 transition-all border-none bg-white group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-100 transition-colors" />
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-widest">{pkg.levels?.name}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">{pkg.title}</h3>
                  <p className="text-sm text-slate-500 mb-8 line-clamp-2 font-medium">{pkg.description || 'Tidak ada deskripsi.'}</p>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                    <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                      <Target className="w-4 h-4" /> Paket Kustom
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeletePackage(pkg.id)}
                      className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg"
                    >
                       <Trash2 className="w-4 h-4" />
                     </Button>
                  </div>
                </div>
              </Card>
            ))}
            {packages.length === 0 && (
              <div className="col-span-full text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                 <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                 <p className="text-slate-400 font-black text-lg">Belum ada paket kuis.</p>
                 <Button variant="ghost" onClick={() => setView('create')} className="mt-4 text-indigo-600 font-black tracking-widest uppercase text-xs">Mulai buat paket tes pertama Anda</Button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-4">
             <Button variant="ghost" onClick={() => setView('list')} className="rounded-full">
               <ChevronLeft className="w-6 h-6" />
             </Button>
             <div>
               <h1 className="text-3xl font-black text-slate-900">Buat Paket Tes Baru</h1>
               <p className="text-slate-500 font-medium">Susun soal-soal pilihan untuk dijadikan satu paket ujian.</p>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
             {/* Left: Metadata */}
             <div className="space-y-6">
                <Card className="p-8 space-y-6 sticky top-8">
                   <h3 className="text-xl font-black text-slate-900 border-b pb-4">Info Paket</h3>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul Paket</label>
                     <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Tryout Akbar POLRI 2024" className="h-14 bg-slate-50 border-none rounded-2xl" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jenjang Target</label>
                     <select 
                        value={selectedLevelId} 
                        onChange={(e) => {
                          setSelectedLevelId(e.target.value);
                          fetchSubjects(e.target.value);
                        }}
                        className="w-full h-14 bg-slate-50 border-none rounded-2xl px-4 text-sm font-bold text-slate-600"
                     >
                        <option value="">Pilih Jenjang...</option>
                        {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                     </select>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi (Opsional)</label>
                     <textarea 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-medium h-24"
                        placeholder="Petunjuk pengerjaan..."
                     />
                   </div>
                   <div className="pt-4">
                      <div className="p-4 bg-indigo-50 rounded-2xl mb-6">
                         <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-1">Total Terpilih</p>
                         <p className="text-2xl font-black text-indigo-900">{selectedQuestionIds.length} Soal</p>
                      </div>
                      <Button onClick={handleCreatePackage} className="w-full h-14 rounded-2xl shadow-xl shadow-indigo-200">Simpan Paket Tes</Button>
                   </div>
                </Card>
             </div>

             {/* Right: Question Picker */}
             <div className="lg:col-span-2 space-y-6">
                <Card className="p-8 space-y-8">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <h3 className="text-xl font-black text-slate-900">Pilih Soal dari Bank Soal</h3>
                      <div className="flex gap-4">
                         <select 
                            disabled={!selectedLevelId}
                            value={selectedSubjectId} 
                            onChange={(e) => {
                              setSelectedSubjectId(e.target.value);
                              fetchQuestions(e.target.value);
                            }}
                            className="h-12 bg-slate-50 border-none rounded-xl px-4 text-xs font-bold text-slate-600 min-w-[180px]"
                         >
                            <option value="">Filter Mata Pelajaran...</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                         </select>
                      </div>
                   </div>

                   <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        placeholder="Cari kata kunci soal..." 
                        className="h-12 pl-12 bg-slate-50 border-none rounded-xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                   </div>

                   <div className="space-y-4">
                      {availableQuestions.filter(q => q.question_text.toLowerCase().includes(searchQuery.toLowerCase())).map((q) => (
                        <div 
                           key={q.id} 
                           onClick={() => toggleQuestion(q.id)}
                           className={`p-6 rounded-2xl border-2 transition-all cursor-pointer group flex items-start gap-4 ${
                             selectedQuestionIds.includes(q.id)
                             ? 'border-indigo-600 bg-indigo-50/50'
                             : 'border-slate-100 hover:border-indigo-200'
                           }`}
                        >
                           <div className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                             selectedQuestionIds.includes(q.id)
                             ? 'bg-indigo-600 border-indigo-600 text-white'
                             : 'border-slate-200'
                           }`}>
                              {selectedQuestionIds.includes(q.id) && <CheckCircle2 className="w-4 h-4" />}
                           </div>
                           <div className="flex-1">
                              <p className="font-bold text-slate-800 leading-relaxed mb-2">{q.question_text}</p>
                              <div className="flex gap-4">
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white px-2 py-1 rounded border border-slate-100">{q.difficulty_level}</span>
                                 <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest bg-white px-2 py-1 rounded border border-indigo-50">{q.type}</span>
                              </div>
                           </div>
                        </div>
                      ))}
                      {!selectedSubjectId && <p className="text-center py-20 text-slate-400 font-medium italic">Pilih Jenjang dan Mata Pelajaran untuk memuat soal.</p>}
                      {selectedSubjectId && availableQuestions.length === 0 && <p className="text-center py-20 text-slate-400 font-medium italic">Tidak ada soal ditemukan di subjek ini.</p>}
                   </div>
                </Card>
             </div>
          </div>
        </div>
      )}

      {/* Preview Parsed Questions Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
           <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-[32px] shadow-2xl animate-in zoom-in fade-in duration-300">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                 <div>
                    <h2 className="text-2xl font-black text-slate-900">Hasil Pemindaian AI</h2>
                    <p className="text-sm text-slate-500 font-medium">Tinjau soal-soal yang berhasil diekstrak sebelum disimpan.</p>
                 </div>
                 <Button variant="ghost" size="icon" onClick={() => setShowPreviewModal(false)} className="rounded-full">
                    <X className="w-6 h-6" />
                 </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 space-y-6">
                 <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                      AI telah mengekstrak <strong>{parsedQuestions.length} soal</strong>. Mohon pastikan tingkat kesulitan dan kunci jawaban sudah sesuai dengan materi Anda sebelum disimpan ke Bank Soal.
                    </p>
                 </div>

                 {parsedQuestions.map((q, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                       <div className="flex justify-between items-start gap-4">
                          <span className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-black text-sm">{idx + 1}</span>
                          <textarea 
                            value={q.question_text} 
                            onChange={(e) => {
                               const newQs = [...parsedQuestions];
                               newQs[idx].question_text = e.target.value;
                               setParsedQuestions(newQs);
                            }}
                            className="flex-1 text-sm font-bold text-slate-800 bg-slate-50 border-none rounded-xl p-3 min-h-[80px]"
                          />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          {q.choices.map((c: any, cIdx: number) => (
                             <div key={cIdx} className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${c.is_correct ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100'}`}>
                                <input 
                                  type="checkbox" 
                                  checked={c.is_correct} 
                                  onChange={() => {
                                     const newQs = [...parsedQuestions];
                                     newQs[idx].choices = newQs[idx].choices.map((ch: any, i: number) => ({ ...ch, is_correct: i === cIdx }));
                                     setParsedQuestions(newQs);
                                  }}
                                  className="w-4 h-4 accent-emerald-600"
                                />
                                <input 
                                  value={c.text} 
                                  onChange={(e) => {
                                     const newQs = [...parsedQuestions];
                                     newQs[idx].choices[cIdx].text = e.target.value;
                                     setParsedQuestions(newQs);
                                  }}
                                  className="flex-1 bg-transparent border-none text-xs font-medium"
                                />
                             </div>
                          ))}
                       </div>
                    </div>
                 ))}
              </div>

              <div className="p-8 border-t border-slate-100 bg-white space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Simpan ke Mata Pelajaran</label>
                       <select 
                         value={selectedSubjectId} 
                         onChange={(e) => setSelectedSubjectId(e.target.value)}
                         className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 text-xs font-bold"
                       >
                         <option value="">Pilih Subjek...</option>
                         {allSubjects.map(s => (
                           <option key={s.id} value={s.id}>{s.name} - {s.levels?.name}</option>
                         ))}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul Paket Kuis</label>
                       <Input 
                         value={aiPackageTitle} 
                         onChange={(e) => setAiPackageTitle(e.target.value)}
                         placeholder="Contoh: Tryout Paket A..."
                         className="h-12 bg-slate-50 border-none rounded-xl"
                       />
                    </div>
                 </div>
                 <Button 
                   onClick={saveParsedQuestions} 
                   disabled={!selectedSubjectId || parsedQuestions.length === 0}
                   className="w-full h-14 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-100 font-black"
                 >
                    Simpan ke Bank Soal & Buat Paket Kuis
                 </Button>
              </div>
           </Card>
        </div>
      )}
    </div>
  );
};

export default ManageQuizzes;
