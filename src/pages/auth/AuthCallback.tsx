import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Spinner } from '../../components/ui';

/**
 * Halaman callback setelah Google OAuth.
 * Mengecek apakah profil pengguna sudah punya role.
 * - Jika belum ada role → arahkan ke /role-selection
 * - Jika sudah ada role → arahkan sesuai peran
 */
const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      // Tunggu Supabase memproses session dari URL hash
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        navigate('/login');
        return;
      }

      // Cek apakah profil sudah ada dan punya role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, created_at')
        .eq('id', session.user.id)
        .single();

      // Jika user baru login via Google (umur profil < 1 menit) dan tidak ada metadata role bawaan
      const isNewOAuthUser = profile && 
        (new Date().getTime() - new Date(profile.created_at).getTime() < 60000) && 
        !session.user.user_metadata?.role;

      if (!profile || !profile.role || isNewOAuthUser) {
        // Pengguna baru atau belum punya role → pilih peran
        navigate('/role-selection');
      } else {
        // Arahkan sesuai role
        switch (profile.role) {
          case 'teacher':
            navigate('/teacher');
            break;
          case 'super_admin':
          case 'admin':
            navigate('/super-admin');
            break;
          default:
            navigate('/dashboard');
        }
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-4">
        <Spinner className="w-10 h-10 text-indigo-600 mx-auto" />
        <p className="text-slate-500 font-medium text-sm">Memverifikasi akun Anda...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
