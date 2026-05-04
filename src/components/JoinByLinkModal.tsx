import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {toast} from 'sonner';
import {useNavigate} from 'react-router-dom';
import {axiosInstance} from '@/api/auth';
import type {AxiosError} from 'axios';
import {Loader2} from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const JoinByLinkModal = ({ open, onOpenChange }: Props) => {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoin = async () => {
    if (!token.trim()) {
      toast.error('❌ Введите токен', {
        description: 'Пригласительный токен не может быть пустым',
      });
      return;
    }

    setIsLoading(true);
    try {
      let cleanToken = token.trim();
      if (cleanToken.includes('/join/')) {
        cleanToken = cleanToken.split('/join/').pop()?.split('?')[0] || cleanToken;
      }

      await axiosInstance.post(`/join/${cleanToken}`);

      toast.success('🎉 Добро пожаловать!', {
        description: 'Вы успешно присоединились к семейной группе',
        duration: 3000,
      });

      onOpenChange(false);
      setToken('');
      navigate('/families');
    } catch (err: unknown) {
      let errorMsg = 'Ошибка при вступлении в группу';

      if (err instanceof Error) {
        const axiosError = err as AxiosError<{ detail?: string }>;
        const serverMessage = axiosError.response?.data?.detail;
        errorMsg = serverMessage || err.message || errorMsg;
      }

      toast.error('❌ Ошибка', {
        description: errorMsg,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-[var(--glass-border)]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Вступить в семейную группу</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">
              Пригласительный токен или ссылка
            </label>
            <Input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="https://vetvi.app/join/... или просто токен"
              className="bg-black/50"
              disabled={isLoading}
            />
            <p className="text-xs text-slate-500 mt-2">
              Вставьте ссылку или токен, который вам прислали
            </p>
          </div>

          <Button
            onClick={handleJoin}
            disabled={isLoading || !token.trim()}
            className="w-full bg-gradient-to-r from-[var(--secondary)] to-[var(--primary)] hover:from-cyan-400 hover:to-purple-400 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Проверяем...
              </>
            ) : (
              'Присоединиться'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};