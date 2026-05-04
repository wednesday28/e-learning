import React from 'react'
import { HelpCircle } from 'lucide-react'

interface AISuggestedQuestionsProps {
  onSelect: (question: string) => void
  subject?: string
}

export const AISuggestedQuestions: React.FC<AISuggestedQuestionsProps> = ({ onSelect, subject }) => {
  const suggestions = [
    `Jelaskan lagi tentang materi ini dalam bahasa yang lebih mudah.`,
    `Berikan contoh soal latihan dari topik ${subject || 'ini'}.`,
    `Apa poin-poin penting yang harus saya hafal?`,
    `Berikan kuis singkat untuk mengetes pemahaman saya.`
  ]

  return (
    <div className="px-4 py-3 bg-indigo-50 border-t border-indigo-100">
      <div className="flex items-center gap-2 mb-2 text-indigo-700">
        <HelpCircle className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wider">Saran Pertanyaan</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((q, i) => (
          <button
            key={i}
            onClick={() => onSelect(q)}
            className="text-left text-[11px] bg-white border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 hover:border-indigo-300 transition-all shadow-sm active:scale-95"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}
