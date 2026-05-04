import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'

export type UserRole = 'student' | 'teacher' | 'admin' | 'super_admin'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: UserRole
  status: 'active' | 'pending' | 'suspended'
  level_id?: string
  grade_id?: string
  total_xp?: number
  avatar_url?: string
  phone?: string
  school_name?: string
  address?: string
  bio?: string
}


interface AuthState {
  user: User | null
  profile: Profile | null
  session: any | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setSession: (session: any | null) => void
  setIsLoading: (isLoading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setSession: (session) => set({ session }),
  setIsLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, profile: null, session: null }),
}))
