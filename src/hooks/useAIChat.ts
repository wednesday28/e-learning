import { useCallback } from 'react'
import { useAIStore } from '../store/useAIStore'

interface ChatContext {
  subject?: string
  grade?: number | string
  lessonId?: string
  lessonTitle?: string
  content?: string
}

export const useAIChat = () => {
  const { 
    messages, 
    addMessage, 
    setLoading, 
    setTyping, 
    setError, 
    isLoading,
    lessonContext,
  } = useAIStore()

  const sendMessage = useCallback(async (userContent: string, overrideContext?: ChatContext) => {
    if (!userContent.trim() || isLoading) return

    // Rate limiting: 20 messages per session
    if (messages.filter(m => m.role === 'user').length >= 20) {
      setError('Batas chat (20 pesan) tercapai untuk sesi ini.')
      return
    }

    // Merge: prioritize overrideContext, then fall back to global lessonContext from store
    const ctx: ChatContext = {
      ...lessonContext,
      ...overrideContext,
    }

    // Add user message
    addMessage({ role: 'user', content: userContent })
    setLoading(true)
    setTyping(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userContent,
          subject: ctx.subject,
          grade: ctx.grade,
          lessonId: ctx.lessonId,
          lessonTitle: ctx.lessonTitle,
          content: ctx.content,
        })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.reply || errData.message || 'Gagal menghubungi AI Tutor.')
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
  }, [messages, addMessage, setLoading, setTyping, setError, isLoading, lessonContext])

  return { sendMessage, isLoading }
}
