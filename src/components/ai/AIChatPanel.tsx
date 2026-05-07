import React, { useRef, useEffect, useState } from 'react'
import { Bot, User, X, RefreshCw, Sparkles, Save, CheckCircle, BookOpen, Package } from 'lucide-react'
import { useAIStore } from '../../store/useAIStore'
import { useAIChat } from '../../hooks/useAIChat'
import { AIChatInput } from './AIChatInput'
import { AISuggestedQuestions } from './AISuggestedQuestions'
import { useAuthStore } from '../../store/useAuthStore'
import { supabase } from '../../lib/supabase'

interface AIChatPanelProps {
  subject?: string
  grade?: number
  lessonId?: string
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({ subject, grade, lessonId }) => {
  const { isOpen, setOpen, messages, isLoading, isTyping, error, setError, lessonContext } = useAIStore()
  const { sendMessage } = useAIChat()
  const { profile } = useAuthStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Per-message saved state
  const [savedMessageIds, setSavedMessageIds] = useState<Record<string, boolean>>({})
  // Saving modal state
  const [savingModal, setSavingModal] = useState<{ msgId: string; questions: any[] } | null>(null)
  const [packageName, setPackageName] = useState('')
  const [levels, setLevels] = useState<any[]>([])
  const [selectedLevelId, setSelectedLevelId] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (savingModal) {
      supabase.from('levels').select('*').then(({ data }) => setLevels(data || []))
      setPackageName(lessonContext?.lessonTitle ? `Kuis: ${lessonContext.lessonTitle}` : 'Kuis AI Baru')
    }
  }, [savingModal])

  const parseQuizJSON = (content: string) => {
    try {
      const match = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        const data = JSON.parse(match[1]);
        if (Array.isArray(data) && data[0] && data[0].question_text) {
          return data;
        }
      }
    } catch (e) {
      // Not a valid JSON or doesn't exist
    }
    return null;
  }

  const handleSaveToPackage = async () => {
    if (!savingModal || !packageName || !selectedLevelId) {
      alert('Mohon isi nama paket dan pilih jenjang.');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Create the quiz package under teacher's account
      const { data: pkg, error: pkgErr } = await supabase
        .from('quiz_packages')
        .insert({
          teacher_id: profile?.id,
          title: packageName,
          description: `Dibuat dari Chat AI Tutor${lessonContext?.subject ? ` • ${lessonContext.subject}` : ''}`,
          level_id: selectedLevelId,
        })
        .select()
        .single();

      if (pkgErr) throw pkgErr;

      // 2. Insert questions + choices, then link to package
      const insertedIds: string[] = [];
      for (const q of savingModal.questions) {
        const { data: qData, error: qErr } = await supabase
          .from('questions')
          .insert({
            question_text: q.question_text || q.question,
            difficulty_level: q.difficulty_level || 'medium',
            type: 'multiple_choice',
          })
          .select()
          .single();

        if (qErr) throw qErr;
        insertedIds.push(qData.id);

        // Insert choices
        const choices = (q.choices || []).map((c: any) => ({
          question_id: qData.id,
          choice_text: c.text,
          is_correct: !!c.is_correct,
        }));
        if (choices.length > 0) {
          await supabase.from('choices').insert(choices);
        }
      }

      // 3. Link all questions to the package
      const links = insertedIds.map((id, index) => ({
        package_id: pkg.id,
        question_id: id,
        order_index: index,
      }));
      await supabase.from('quiz_package_questions').insert(links);

      // 4. Mark as saved and close modal
      setSavedMessageIds(prev => ({ ...prev, [savingModal.msgId]: true }));
      setSavingModal(null);
      setPackageName('');
      setSelectedLevelId('');

      alert(`✅ Berhasil! ${insertedIds.length} soal tersimpan ke Paket Tes "${packageName}".\nBuka menu Quizzes untuk menggunakannya!`);

    } catch (err: any) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  if (!isOpen) return null

  return (
    <div className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-[60] flex flex-col animate-slide-in-right border-l border-gray-100">
      {/* Header */}
      <div className="bg-indigo-600 p-4 flex flex-col gap-2 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">AI Guru Pembimbing</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <p className="text-[10px] text-indigo-100 uppercase tracking-widest font-medium">Online</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setOpen(false)}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Active Lesson Context Banner */}
        {lessonContext?.lessonTitle && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-indigo-200 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Sedang Membaca</p>
              <p className="text-xs text-white font-semibold truncate">{lessonContext.lessonTitle}</p>
              {lessonContext.subject && <p className="text-[10px] text-indigo-200">{lessonContext.subject} • {lessonContext.grade}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-indigo-100 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h4 className="text-gray-800 font-bold">Halo! Saya AI Guru Anda</h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Tanyakan apa saja tentang pelajaran hari ini. Jika Anda Guru, ketik "Buatkan soal kuis dari: [teks materi]" untuk membuat kuis instan!
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const quizData = msg.role === 'assistant' ? parseQuizJSON(msg.content) : null;
          
          return (
            <div 
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-2 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                  msg.role === 'user' ? 'bg-indigo-100' : 'bg-white shadow-sm border border-gray-100'
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-indigo-600" /> : <Bot className="w-4 h-4 text-indigo-600" />}
                </div>
                
                <div className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                }`}>
                  {quizData ? (
                    <div className="space-y-3 min-w-[200px]">
                      <div className="flex items-center gap-2 text-indigo-600 font-bold">
                        <Sparkles className="w-5 h-5" />
                        <span>Kuis AI Siap!</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        AI berhasil membuat <strong>{quizData.length} Soal Pilihan Ganda</strong>. Simpan ke Paket Tes Anda?
                      </p>
                      
                      <button 
                        onClick={() => !savedMessageIds[msg.id] && setSavingModal({ msgId: msg.id, questions: quizData })}
                        disabled={!!savedMessageIds[msg.id]}
                        className={`w-full py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                          savedMessageIds[msg.id] 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200'
                        }`}
                      >
                        {savedMessageIds[msg.id] ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Tersimpan ke Paket Tes
                          </>
                        ) : (
                          <>
                            <Package className="w-4 h-4" />
                            Simpan ke Paket Tes Saya
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-2 items-center bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
              </div>
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">AI sedang berpikir</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center justify-between gap-3">
            <p className="text-xs text-red-600">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="p-1 hover:bg-red-100 rounded-md transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-red-600" />
            </button>
          </div>
        )}
      </div>

      {/* Suggested Questions */}
      {messages.length < 5 && !isLoading && (
        <AISuggestedQuestions 
          subject={subject} 
          onSelect={(q) => sendMessage(q, { subject, grade, lessonId })} 
        />
      )}

      {/* Input */}
      <AIChatInput 
        onSend={(msg) => sendMessage(msg, { subject, grade, lessonId })} 
        disabled={isLoading}
      />

      {/* Save to Package Modal */}
      {savingModal && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-10 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full rounded-3xl shadow-2xl p-6 space-y-4 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900">Simpan ke Paket Tes</h3>
                <p className="text-xs text-slate-500">{savingModal.questions.length} soal pilihan ganda</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Paket Tes</label>
                <input
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  className="w-full mt-1 h-12 bg-slate-50 rounded-xl px-4 text-sm font-bold border-none outline-none"
                  placeholder="Contoh: Kuis Bab 1 - Fotosintesis"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jenjang</label>
                <select
                  value={selectedLevelId}
                  onChange={(e) => setSelectedLevelId(e.target.value)}
                  className="w-full mt-1 h-12 bg-slate-50 rounded-xl px-4 text-sm font-bold border-none outline-none"
                >
                  <option value="">Pilih Jenjang...</option>
                  {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setSavingModal(null); setSelectedLevelId(''); }}
                className="flex-1 h-12 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveToPackage}
                disabled={isSaving || !packageName || !selectedLevelId}
                className="flex-1 h-12 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
