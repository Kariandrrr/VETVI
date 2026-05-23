import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { axiosInstance } from '@/api/auth';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const JoinByLinkModal = ({ open, onOpenChange }: Props) => {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleJoin = async () => {
    if (!token.trim()) {
      toast.error('❌ Введите токен');
      return;
    }

    setIsLoading(true);
    try {
      let cleanToken = token.trim();
      if (cleanToken.includes('/join/')) {
        cleanToken = cleanToken.split('/join/').pop()?.split('?')[0] || cleanToken;
      }

      await axiosInstance.post(`/join/${cleanToken}`);

      await queryClient.invalidateQueries({ queryKey: ['members'] });
      await queryClient.invalidateQueries({ queryKey: ['familyTree'] });
      await queryClient.invalidateQueries({ queryKey: ['families'] });

      toast.success('🎉 Добро пожаловать в семью!');
      onOpenChange(false);
    } catch (error: unknown) {
    console.error(error);

    let message = 'Ошибка при вступлении в группу';

    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'object' && error !== null && 'response' in error) {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      message = axiosError.response?.data?.detail || message;
    }

    toast.error('❌ Ошибка', { description: message });
  }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Вступить в семейную группу</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">
              Пригласительный токен или ссылка
            </label>
            <Input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Вставьте ссылку или токен..."
              disabled={isLoading}
            />
          </div>

          <Button
            onClick={handleJoin}
            disabled={isLoading || !token.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Присоединяемся...
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