import { create } from 'zustand'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface AIState {
  isOpen: boolean
  messages: Message[]
  isLoading: boolean
  isTyping: boolean
  error: string | null
  unreadCount: number
  toggleChat: () => void
  setOpen: (isOpen: boolean) => void
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  setLoading: (isLoading: boolean) => void
  setTyping: (isTyping: boolean) => void
  setError: (error: string | null) => void
  clearMessages: () => void
  resetUnread: () => void
}

export const useAIStore = create<AIState>((set) => ({
  isOpen: false,
  messages: [],
  isLoading: false,
  isTyping: false,
  error: null,
  unreadCount: 0,

  toggleChat: () => set((state) => ({ 
    isOpen: !state.isOpen,
    unreadCount: !state.isOpen ? 0 : state.unreadCount 
  })),

  setOpen: (isOpen) => set({ 
    isOpen,
    unreadCount: isOpen ? 0 : 0
  }),

  addMessage: (msg) => set((state) => ({
    messages: [
      ...state.messages,
      { ...msg, id: Math.random().toString(36).substring(7), timestamp: Date.now() }
    ],
    unreadCount: !state.isOpen && msg.role === 'assistant' ? state.unreadCount + 1 : state.unreadCount
  })),

  setLoading: (isLoading) => set({ isLoading }),
  setTyping: (isTyping) => set({ isTyping }),
  setError: (error) => set({ error }),
  clearMessages: () => set({ messages: [], unreadCount: 0, error: null }),
  resetUnread: () => set({ unreadCount: 0 }),
}))
