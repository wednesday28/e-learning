import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Button, Card } from '../../components/ui';
import { GraduationCap, School, BookOpen, CheckCircle2 } from 'lucide-react';

const RoleSelection = () => {
  const { user, setProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | null>(null);
  const navigate = useNavigate();

  const handleConfirmRole = async () => {
    if (!selectedRole || !user) return;
    setIsLoading(true);

    try {
      const status = selectedRole === 'teacher' ? 'pending' : 'active';
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          role: selectedRole,
          status: status 
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setProfile(data);
      
      if (selectedRole === 'teacher') {
        alert('Profil Anda telah diatur sebagai Pengajar. Silakan tunggu verifikasi dari Super Admin.');
      }
      
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error updating role:', err.message);
      alert('Gagal menyimpan pilihan peran. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-6 text-3xl font-black text-slate-900 tracking-tight italic">
            Satu langkah lagi...
          </h1>
          <p className="mt-2 text-slate-500 font-medium">
            Pilih peran Anda untuk menyesuaikan pengalaman belajar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Option: Student */}
          <div 
            onClick={() => setSelectedRole('student')}
            className={`cursor-pointer group transition-all duration-300 transform hover:-translate-y-1 ${
              selectedRole === 'student' ? 'ring-4 ring-indigo-500 ring-offset-4' : ''
            }`}
          >
            <Card className={`p-8 h-full flex flex-col items-center text-center space-y-4 border-2 ${
              selectedRole === 'student' ? 'border-indigo-500 bg-indigo-50/50' : 'border-white hover:border-indigo-100'
            }`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
                selectedRole === 'student' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'
              }`}>
                <GraduationCap className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Pelajar</h3>
                <p className="text-sm text-slate-500 mt-2 font-medium">
                  Akses ribuan materi, kuis interaktif, dan pantau progres belajarmu.
                </p>
              </div>
              {selectedRole === 'student' && (
                <CheckCircle2 className="w-6 h-6 text-indigo-600 animate-in zoom-in" />
              )}
            </Card>
          </div>

          {/* Option: Teacher */}
          <div 
            onClick={() => setSelectedRole('teacher')}
            className={`cursor-pointer group transition-all duration-300 transform hover:-translate-y-1 ${
              selectedRole === 'teacher' ? 'ring-4 ring-amber-500 ring-offset-4' : ''
            }`}
          >
            <Card className={`p-8 h-full flex flex-col items-center text-center space-y-4 border-2 ${
              selectedRole === 'teacher' ? 'border-amber-500 bg-amber-50/50' : 'border-white hover:border-amber-100'
            }`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
                selectedRole === 'teacher' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-amber-100 group-hover:text-amber-500'
              }`}>
                <School className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Pengajar</h3>
                <p className="text-sm text-slate-500 mt-2 font-medium">
                  Kelola kelas, buat kuis, dan bimbing siswa menuju kesuksesan.
                </p>
              </div>
              {selectedRole === 'teacher' && (
                <CheckCircle2 className="w-6 h-6 text-amber-500 animate-in zoom-in" />
              )}
            </Card>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <Button 
            onClick={handleConfirmRole}
            disabled={!selectedRole || isLoading}
            isLoading={isLoading}
            className="w-full max-w-xs h-14 text-lg font-black shadow-lg shadow-indigo-200"
          >
            Selesaikan Pendaftaran
          </Button>
        </div>

        <p className="text-center text-xs text-slate-400 font-medium">
          *Akun pengajar memerlukan verifikasi admin dalam 1x24 jam.
        </p>
      </div>
    </div>
  );
};

export default RoleSelection;
