import React from 'react'
import { MessageCircle, X } from 'lucide-react'
import { useAIStore } from '../../store/useAIStore'

export const AIChatButton: React.FC = () => {
  const { isOpen, toggleChat, unreadCount } = useAIStore()

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {unreadCount > 0 && !isOpen && (
        <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-bounce">
          {unreadCount} pesan baru
        </div>
      )}
      
      <button
        onClick={toggleChat}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 transform hover:scale-110 active:scale-95 ${
          isOpen 
            ? 'bg-gray-200 text-gray-800' 
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
        title="Chat dengan AI Guru"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>
    </div>
  )
}
