import React, { useRef, useEffect, useState } from 'react'
import { Bot, User, X, RefreshCw, Sparkles, Save, CheckCircle } from 'lucide-react'
import { useAIStore } from '../../store/useAIStore'
import { useAIChat } from '../../hooks/useAIChat'
import { AIChatInput } from './AIChatInput'
import { AISuggestedQuestions } from './AISuggestedQuestions'

interface AIChatPanelProps {
  subject?: string
  grade?: number
  lessonId?: string
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({ subject, grade, lessonId }) => {
  const { isOpen, setOpen, messages, isLoading, isTyping, error, setError } = useAIStore()
  const { sendMessage } = useAIChat()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [savedMessageIds, setSavedMessageIds] = useState<Record<string, boolean>>({})

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

  const handleSaveToBank = async (msgId: string, questions: any[]) => {
    // In a real implementation, this would trigger a modal to select Subject/Class 
    // and then save to Supabase `questions` table.
    // For this demo, we mark it as saved.
    setSavedMessageIds(prev => ({ ...prev, [msgId]: true }))
    alert(`Berhasil menyimpan ${questions.length} soal ke Bank Soal! (Simulasi)`);
  }

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
      <div className="bg-indigo-600 p-4 flex items-center justify-between text-white shadow-md">
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
                Tanyakan apa saja tentang pelajaran hari ini. Saya siap membantu Anda memahami materi lebih dalam.
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
                        <span>Kuis AI Ditemukan!</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        AI telah berhasil men-generate <strong>{quizData.length} Soal Pilihan Ganda</strong> dari materi yang Anda berikan.
                      </p>
                      
                      <button 
                        onClick={() => handleSaveToBank(msg.id, quizData)}
                        disabled={savedMessageIds[msg.id]}
                        className={`w-full py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                          savedMessageIds[msg.id] 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200'
                        }`}
                      >
                        {savedMessageIds[msg.id] ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Tersimpan ke Bank Soal
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Simpan ke Bank Soal
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
    </div>
  )
}
