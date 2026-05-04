import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/useAuthStore'
import type { Profile } from '../store/useAuthStore'

export const useAuth = () => {
  const { setUser, setProfile, setSession, setIsLoading } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setIsLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setIsLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [setUser, setProfile, setSession, setIsLoading])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // Magic Bypass for Admin
      const ADMIN_EMAILS = ['henceruindungan@gmail.com', 'jeniferlumoindong68@guru.smp.belajar.id'];
      
      if (error || !data) {
        console.warn('Profile not found, using auth metadata fallback');
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const isMagicAdmin = ADMIN_EMAILS.includes(user.email || '');
          setProfile({
            id: user.id,
            full_name: user.user_metadata.full_name || user.user_metadata.name || 'User',
            email: user.email || '',
            role: isMagicAdmin ? 'super_admin' : (user.user_metadata.role as any || 'student'),
            status: 'active'
          } as Profile);
        }
      } else {
        const isMagicAdmin = ADMIN_EMAILS.includes(data.email || '');
        if (isMagicAdmin && data.role !== 'super_admin') {
           data.role = 'super_admin';
        }
        setProfile(data as Profile);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return { fetchProfile }
}
