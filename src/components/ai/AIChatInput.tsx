import React, { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'

interface AIChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

export const AIChatInput: React.FC<AIChatInputProps> = ({ onSend, disabled }) => {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input)
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  return (
    <div className="p-4 border-t bg-white">
      <div className="relative flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, 500))}
          onKeyDown={handleKeyDown}
          placeholder="Tanya AI Guru..."
          disabled={disabled}
          className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none max-h-32 disabled:opacity-50"
          rows={1}
        />
        
        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-md flex-shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
      
      <div className="mt-2 flex justify-between items-center px-1">
        <p className="text-[10px] text-gray-400">
          Maks. 500 karakter
        </p>
        <p className={`text-[10px] ${input.length >= 450 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
          {input.length}/500
        </p>
      </div>
    </div>
  )
}
