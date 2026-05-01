import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const JoinByLinkModal = ({ open, onOpenChange }: Props) => {
  const [token, setToken] = useState('');
  const navigate = useNavigate();

  const handleJoin = () => {
    if (!token.trim()) {
      toast.error('❌ Введите токен', {
        description: 'Пригласительный токен не может быть пустым',
      });
      return;
    }

    // Извлекаем токен из полной ссылки, если вставили URL
    const tokenMatch = token.match(/\/join\/([a-f0-9-]+)/i);
    const cleanToken = tokenMatch ? tokenMatch[1] : token.trim();

    toast.success('🔗 Переход к присоединению...', {
      description: 'Проверка пригласительного токена',
    });

    onOpenChange(false);
    navigate(`/join/${cleanToken}`);
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
              Пригласительный токен
            </label>
            <Input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="https://vetvi.app/join/... или просто токен"
              className="bg-black/50"
            />
            <p className="text-xs text-slate-500 mt-2">
              Вставьте токен, который вам прислали
            </p>
          </div>

          <Button
            onClick={handleJoin}
            className="w-full bg-gradient-to-r from-[var(--secondary)] to-[var(--primary)] hover:from-cyan-400 hover:to-purple-400 text-white"
          >
            Присоединиться
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};