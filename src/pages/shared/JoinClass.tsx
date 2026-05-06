import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Spinner, Card, Button } from '../../components/ui';
import { School, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

const JoinClass = () => {
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_joined'>('loading');
  const [className, setClassName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const processJoin = async () => {
      const joinCode = code || searchParams.get('code');
      if (!joinCode) {
        setStatus('error');
        setErrorMessage('Kode kelas tidak ditemukan.');
        return;
      }

      try {
        // 1. Cari kelas
        const { data: cls, error: clsError } = await supabase
          .from('classes')
          .select('id, name')
          .eq('join_code', joinCode.toUpperCase())
          .single();

        if (clsError || !cls) {
          throw new Error('Kode kelas tidak valid atau kelas tidak ditemukan.');
        }

        setClassName(cls.name);

        // 2. Cek apakah user sudah login
        if (!user) {
          // Redirect ke login tapi simpan kode di localStorage/URL
          setStatus('error');
          setErrorMessage('Silakan login atau daftar terlebih dahulu untuk bergabung.');
          return;
        }

        // 3. Jika sudah login, coba gabung
        const { error: joinError } = await supabase
          .from('class_students')
          .insert({
            class_id: cls.id,
            student_id: user.id
          });

        if (joinError) {
          if (joinError.code === '23505') {
            setStatus('already_joined');
          } else {
            throw joinError;
          }
        } else {
          setStatus('success');
        }

      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'Gagal bergabung dengan kelas.');
      }
    };

    processJoin();
  }, [code, user, searchParams]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-10 text-center space-y-6 shadow-2xl shadow-slate-200/50 rounded-[40px]">
        {status === 'loading' && (
          <div className="py-10 flex flex-col items-center gap-4">
            <Spinner className="w-10 h-10 text-indigo-600" />
            <p className="text-slate-500 font-bold animate-pulse">Memproses permintaan gabung...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6 py-4">
            <div className="w-20 h-20 bg-emerald-100 rounded-[28px] flex items-center justify-center text-emerald-600 mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Berhasil Gabung!</h2>
              <p className="text-slate-500 font-medium">Kamu sekarang adalah bagian dari kelas <span className="text-indigo-600 font-bold">{className}</span>.</p>
            </div>
            <Button onClick={() => navigate('/dashboard')} className="w-full h-14 rounded-2xl shadow-lg shadow-indigo-100">
              Masuk ke Dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {status === 'already_joined' && (
          <div className="space-y-6 py-4">
            <div className="w-20 h-20 bg-indigo-100 rounded-[28px] flex items-center justify-center text-indigo-600 mx-auto">
              <School className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sudah Terdaftar</h2>
              <p className="text-slate-500 font-medium">Kamu sudah menjadi anggota kelas <span className="text-indigo-600 font-bold">{className}</span>.</p>
            </div>
            <Button onClick={() => navigate('/dashboard')} className="w-full h-14 rounded-2xl shadow-lg shadow-indigo-100">
              Buka Dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6 py-4">
            <div className="w-20 h-20 bg-rose-100 rounded-[28px] flex items-center justify-center text-rose-600 mx-auto">
              <AlertCircle className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Oops! Terjadi Masalah</h2>
              <p className="text-slate-500 font-medium">{errorMessage}</p>
            </div>
            {!user ? (
              <div className="flex gap-3">
                <Button onClick={() => navigate(`/login?redirect=/join/${code}`)} variant="outline" className="flex-1 h-12 rounded-xl">Masuk</Button>
                <Button onClick={() => navigate(`/register?redirect=/join/${code}`)} className="flex-1 h-12 rounded-xl">Daftar</Button>
              </div>
            ) : (
              <Button onClick={() => navigate('/dashboard')} variant="ghost" className="w-full">
                Kembali ke Dashboard
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default JoinClass;
