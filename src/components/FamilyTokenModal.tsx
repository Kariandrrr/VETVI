import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyId: string;
  familyName: string;
  token?: string | null;
}

export const FamilyTokenModal = ({ open, onOpenChange, familyId, familyName, token }: Props) => {
  const [copied, setCopied] = useState(false);

  const inviteUrl = token
    ? `${window.location.origin}/join/${token}`
    : `${window.location.origin}/join/${familyId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success('📋 Ссылка скопирована!', {
        description: 'Пригласительная ссылка в буфере обмена',
      });
      setTimeout(() => setCopied(false), 2000);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('❌ Не удалось скопировать', {
        description: 'Скопируйте ссылку вручную',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-[var(--glass-border)] max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">Приглашение в "{familyName}"</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Блок с ссылкой */}
          <div>
            <label className="text-sm text-slate-400 mb-2 block">
              Пригласительная ссылка
            </label>
            <div className="flex gap-2">
              <div className="flex-1 p-3 bg-black/50 rounded-lg border border-[var(--glass-border)] font-mono text-sm text-slate-300 break-all">
                {inviteUrl}
              </div>
              <Button
                onClick={handleCopy}
                className="shrink-0 bg-[var(--secondary)] hover:bg-cyan-300 text-[var(--secondary-foreground)]"
              >
                {copied ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Токен отдельно */}
          {token && (
            <div>
              <label className="text-sm text-slate-400 mb-2 block">
                Токен приглашения
              </label>
              <div className="p-3 bg-black/50 rounded-lg border border-[var(--glass-border)] font-mono text-sm text-slate-300">
                {token}
              </div>
            </div>
          )}

          {/* Инструкция */}
          <div className="p-4 bg-[var(--glass-bg)] rounded-lg border border-[var(--glass-border)]">
            <h4 className="text-sm font-semibold text-white mb-2">Как использовать:</h4>
            <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
              <li>Скопируйте ссылку выше</li>
              <li>Отправьте её родственникам</li>
              <li>Они смогут присоединиться по этой ссылке</li>
            </ol>
          </div>

          <Button
            onClick={() => onOpenChange(false)}
            className="w-full bg-gradient-to-r from-[var(--secondary)] to-[var(--primary)] hover:from-cyan-400 hover:to-purple-400 text-white"
          >
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};