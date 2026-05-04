import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Check, Copy, Sparkles, X} from 'lucide-react';
import {useCreateInvite} from '../hooks/useFamilies';
import type {MembershipRole} from '@/types/families';
import {toast} from 'sonner';
import type {AxiosError} from 'axios';

interface InvitationResponse {
  token?: string;
  [key: string]: unknown;
}

interface Props {
  familyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InviteModal = ({ familyId, open, onOpenChange }: Props) => {
  const [role, setRole] = useState<MembershipRole>('viewer');
  const [email, setEmail] = useState('');
  const [maxUses, setMaxUses] = useState(1);
  const [inviteToken, setInviteToken] = useState('');
  const [copied, setCopied] = useState(false);
  const { mutate, isPending } = useCreateInvite();

  const handleCreate = () => {
    mutate(
      {
        familyId,
        data: {
          assigned_role: role,
          email: email || undefined,
          max_uses: maxUses >= 1 ? maxUses : 1,
        },
      },
      {
        onSuccess: (response: unknown) => {
          const res = response as { data?: InvitationResponse };
          const body = res.data ?? (response as InvitationResponse);

          const token = body?.token;

          if (!token) {
            console.error('❌ Token not found in response:', response);
            toast.error('Ошибка сервера', {
              description: 'Токен не был возвращен',
              duration: 5000,
            });
            return;
          }

          console.log('✅ Generated token:', token);
          setInviteToken(token);

          toast.success('Приглашение создано!', {
            description: 'Скопируйте токен и отправьте его',
            duration: 3000,
          });
        },
        onError: (error: unknown) => {
          let message = 'Не удалось создать приглашение';

          if (error instanceof Error) {
            const axiosError = error as AxiosError<{ detail?: string }>;
            const serverDetail = axiosError.response?.data?.detail;
            if (serverDetail) {
              message = serverDetail;
            }
          }

          toast.error('Ошибка', {
            description: message,
            duration: 5000,
          });
        },
      }
    );
  };

  const copyToken = async () => {
    if (!inviteToken) return;
    try {
      await navigator.clipboard.writeText(inviteToken);
      setCopied(true);
      toast.success('Токен скопирован', {
        description: 'Отправьте его тому, кого хотите пригласить',
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('Не удалось скопировать');
    }
  };

  const resetForm = () => {
    setInviteToken('');
    setEmail('');
    setMaxUses(1);
    setRole('viewer');
    setCopied(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-[var(--glass-border)] max-w-md p-0 overflow-hidden bg-[var(--glass-bg)] backdrop-blur-xl">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-[var(--primary)] rounded-full blur-[90px] opacity-20 pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-[var(--secondary)] rounded-full blur-[90px] opacity-15 pointer-events-none" />

        <DialogHeader className="px-6 pt-6 pb-2 relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
              <Sparkles className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <DialogTitle className="text-2xl font-black text-white tracking-tighter">
              Пригласить в группу
            </DialogTitle>
          </div>
          <p className="text-sm text-slate-400">
            Настройте параметры и получите токен для вступления
          </p>

          <DialogClose className="absolute right-6 top-6 p-2 rounded-full hover:bg-[var(--glass-bg)] hover:text-white transition-colors outline-none">
            <X className="w-5 h-5 text-slate-400" />
          </DialogClose>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5 relative z-10">
          {!inviteToken ? (
            <>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Роль участника
                </label>
                <Select value={role} onValueChange={(v) => setRole(v as MembershipRole)}>
                  <SelectTrigger className="glass-card border-[var(--glass-border)] bg-[var(--glass-bg)] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-[var(--glass-border)] bg-[#121225] text-white">
                    <SelectItem value="viewer" className="focus:bg-[var(--glass-bg)] focus:text-white">Просмотр</SelectItem>
                    <SelectItem value="editor" className="focus:bg-[var(--glass-bg)] focus:text-white">Редактирование</SelectItem>
                    <SelectItem value="admin" className="focus:bg-[var(--glass-bg)] focus:text-white">Администратор</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Email (необязательно)
                </label>
                <Input
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-card border-[var(--glass-border)] bg-[var(--glass-bg)] text-white placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Максимум использований
                </label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={maxUses}
                  onChange={(e) => setMaxUses(Number(e.target.value))}
                  className="glass-card border-[var(--glass-border)] bg-[var(--glass-bg)] text-white"
                />
                <p className="text-xs text-slate-500">
                  Сколько раз токен может быть использован
                </p>
              </div>

              <Button
                onClick={handleCreate}
                disabled={isPending}
                className="w-full bg-[var(--secondary)] hover:bg-cyan-400 text-[var(--secondary-foreground)] font-bold rounded-xl h-12 transition-all duration-300"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Создаём...
                  </span>
                ) : (
                  'Создать токен'
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex flex-col items-center text-center space-y-3 p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
                <div className="p-3 rounded-full bg-green-500/20 border border-green-500/30">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-green-300 font-semibold">Токен создан!</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Токен приглашения
                </label>
                <div className="flex gap-2">
                  <Input
                    value={inviteToken}
                    readOnly
                    className="font-mono text-sm bg-black/30 border-[var(--glass-border)] text-slate-200 truncate"
                  />
                  <Button
                    onClick={copyToken}
                    variant="outline"
                    size="icon"
                    className="shrink-0 glass-card border-[var(--glass-border)] hover:bg-[var(--glass-bg)]"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-[var(--secondary)]" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Скопируйте этот токен и отправьте человеку, которого хотите пригласить. Он вставит его в поле "Вступить по токену"
                </p>
              </div>

              <Button
                onClick={resetForm}
                variant="secondary"
                className="w-full bg-[var(--glass-bg)] hover:bg-[var(--glass-border)] text-white border border-[var(--glass-border)] rounded-xl h-11"
              >
                Создать ещё один токен
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};