import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button, Card, Input } from '../../components/ui';
import { LogIn, BookOpen, Globe } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login gagal. Periksa email dan password Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/dashboard' }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-6 text-3xl font-black text-slate-900 tracking-tight">Selamat Datang!</h1>
          <p className="mt-2 text-slate-500 font-medium text-sm">Masuk untuk melanjutkan belajarmu hari ini.</p>
        </div>

        <Card className="p-8 shadow-xl shadow-slate-200/50">
          <form onSubmit={handleEmailLogin} className="space-y-6">
            <Input 
              label="Email Address" 
              type="email" 
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input 
              label="Password" 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-600 text-xs font-medium border border-rose-100">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-base font-bold" isLoading={isLoading}>
              <LogIn className="w-5 h-5" /> Masuk Sekarang
            </Button>
          </form>

          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold tracking-widest">Atau</span></div>
          </div>

          <Button 
            variant="outline" 
            className="w-full mt-6 h-12 text-slate-600"
            onClick={handleGoogleLogin}
          >
            <Globe className="w-5 h-5 text-indigo-600" /> Masuk dengan Google
          </Button>
        </Card>

        <p className="text-center text-sm text-slate-500">
          Belum punya akun?{' '}
          <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
            Daftar Sekarang
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
