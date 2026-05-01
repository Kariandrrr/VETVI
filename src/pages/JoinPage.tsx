import { axiosInstance } from '@/api/auth';
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { AxiosError } from 'axios';
import { toast } from 'sonner';

export const JoinPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const hasJoined = useRef(false);

  useEffect(() => {
    if (!token || hasJoined.current) return;
    hasJoined.current = true;

    const joinFamily = async () => {
      try {
        await axiosInstance.post(`/join/${token}`);
        setStatus('success');
        setMessage('Вы успешно присоединились к семейной группе!');

        toast.success('🎉 Добро пожаловать!', {
          description: 'Вы успешно присоединились к семейной группе',
          duration: 3000,
        });

        setTimeout(() => navigate('/families'), 2000);
      } catch (err: unknown) {
        setStatus('error');
        let errorMsg = 'Ошибка при вступлении в группу';

        if (err instanceof Error) {
          const axiosError = err as AxiosError<{ detail?: string }>;
          const serverMessage = axiosError.response?.data?.detail;
          errorMsg = serverMessage || err.message || errorMsg;
        }

        setMessage(errorMsg);

        toast.error('❌ Ошибка', {
          description: errorMsg,
          duration: 5000,
        });
      }
    };

    joinFamily();
  }, [token, navigate]);

  if (!token) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
        <div className="glass-card max-w-md w-full p-8 text-center space-y-6">
          <XCircle className="w-16 h-16 mx-auto text-red-400" />
          <h2 className="text-2xl font-bold text-white">Ошибка</h2>
          <p className="text-slate-300">Ссылка недействительна: отсутствует токен приглашения.</p>
          <Button onClick={() => navigate('/')} variant="outline" className="w-full">
            На главную
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
      <div className="glass-card max-w-md w-full p-8 text-center space-y-6">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 mx-auto text-[var(--secondary)] animate-spin" />
            <h2 className="text-2xl font-bold text-white">Вступаем в группу...</h2>
            <p className="text-slate-400">Проверяем приглашение и добавляем вас в семью</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 mx-auto text-green-400" />
            <h2 className="text-2xl font-bold text-white">Успешно!</h2>
            <p className="text-slate-300">{message}</p>
            <Button onClick={() => navigate('/families')} className="w-full">
              Перейти к семейным группам
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 mx-auto text-red-400" />
            <h2 className="text-2xl font-bold text-white">Ошибка</h2>
            <p className="text-slate-300">{message}</p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                На главную
              </Button>
              <Button onClick={() => navigate('/families')} className="w-full">
                К семейным группам
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};