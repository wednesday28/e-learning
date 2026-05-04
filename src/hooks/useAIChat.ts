import { useCallback } from 'react'
import { useAIStore, Message } from '../store/useAIStore'

interface ChatContext {
  subject?: string
  grade?: number
  lessonId?: string
  content?: string
}

export const useAIChat = () => {
  const { 
    messages, 
    addMessage, 
    setLoading, 
    setTyping, 
    setError, 
    isLoading 
  } = useAIStore()

  const sendMessage = useCallback(async (content: string, context?: ChatContext) => {
    if (!content.trim() || isLoading) return

    // Rate limiting: 20 messages per session
    if (messages.filter(m => m.role === 'user').length >= 20) {
      setError('Batas chat (20 pesan) tercapai untuk sesi ini.')
      return
    }

    // Add user message
    addMessage({ role: 'user', content })
    setLoading(true)
    setTyping(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          ...context
        })
      })

      if (!response.ok) {
        throw new Error('Gagal menghubungi AI Tutor.')
      }

      const data = await response.json()
      
      if (data.reply) {
        addMessage({ role: 'assistant', content: data.reply })
      } else {
        throw new Error('Format respon AI tidak valid.')
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.')
    } finally {
      setLoading(false)
      setTyping(false)
    }
  }, [messages, addMessage, setLoading, setTyping, setError, isLoading])

  return { sendMessage, isLoading }
}
