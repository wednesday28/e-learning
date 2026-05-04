import { create } from 'zustand'

interface AppState {
  isSidebarOpen: boolean
  notifications: any[]
  setSidebarOpen: (isOpen: boolean) => void
  addNotification: (notification: any) => void
  clearNotifications: () => void
}

export const useAppStore = create<AppState>((set) => ({
  isSidebarOpen: false,
  notifications: [],
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  addNotification: (notification) => set((state) => ({ 
    notifications: [...state.notifications, notification] 
  })),
  clearNotifications: () => set({ notifications: [] }),
}))
