import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button, Card, Input } from '../../components/ui';
import { UserPlus, BookOpen, GraduationCap, School } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'student' as 'student' | 'teacher'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: formData.role
          }
        }
      });
      if (error) throw error;
      alert('Registrasi berhasil! Silakan periksa email Anda untuk verifikasi.');
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Pendaftaran gagal.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-green-500 rounded-2xl flex items-center justify-center shadow-xl shadow-green-200">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-6 text-3xl font-black text-slate-900 tracking-tight">Buat Akun Baru</h1>
          <p className="mt-2 text-slate-500 font-medium text-sm">Mulai petualangan belajarmu sekarang.</p>
        </div>

        <Card className="p-8 shadow-xl shadow-slate-200/50">
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'student' })}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                  formData.role === 'student' ? 'border-primary bg-indigo-50 text-primary' : 'border-slate-100 text-slate-400'
                }`}
              >
                <GraduationCap className="w-6 h-6" />
                <span className="text-xs font-bold uppercase tracking-widest">Siswa</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'teacher' })}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                  formData.role === 'teacher' ? 'border-primary bg-indigo-50 text-primary' : 'border-slate-100 text-slate-400'
                }`}
              >
                <School className="w-6 h-6" />
                <span className="text-xs font-bold uppercase tracking-widest">Guru</span>
              </button>
            </div>

            <Input 
              label="Nama Lengkap" 
              placeholder="Contoh: Budi Santoso"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
            <Input 
              label="Email Address" 
              type="email" 
              placeholder="nama@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input 
              label="Password" 
              type="password" 
              placeholder="Minimal 6 karakter"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-600 text-xs font-medium border border-rose-100">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-base font-bold" variant="secondary" isLoading={isLoading}>
              <UserPlus className="w-5 h-5" /> Daftar Sekarang
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-slate-500">
          Sudah punya akun?{' '}
          <Link to="/login" className="font-bold text-green-600 hover:text-green-700 transition-colors">
            Masuk Sekarang
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
