import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {toast} from 'sonner';
import {Check, Clock, Copy, Loader2, Plus, Shield, Trash2, Users} from 'lucide-react';
import {useState} from 'react';
import {useDeleteInvite, useFamilyInvites} from '@/hooks/useInvites';
import {useCreateInvite} from '@/hooks/useFamilies';
import {format} from 'date-fns';
import {ru} from 'date-fns/locale';
import type {MembershipRole} from '@/types/families';
import type {AxiosError} from 'axios';

interface InvitationResponse {
  token?: string;
  [key: string]: unknown;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyId: string;
  familyName: string;
}

export const FamilyTokenModal = ({ open, onOpenChange, familyId, familyName }: Props) => {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const { data: invites, isLoading } = useFamilyInvites(familyId);
  const { mutate: createInvite, isPending: isCreating } = useCreateInvite();
  const { mutate: deleteInvite, isPending: isPending } = useDeleteInvite();

  const [role, setRole] = useState<MembershipRole>('viewer');
  const [email, setEmail] = useState('');
  const [maxUses, setMaxUses] = useState(1);
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  const handleCreate = () => {
    createInvite(
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
            toast.error('Ошибка', { description: 'Токен не был возвращён' });
            return;
          }

          setCreatedToken(token);
          toast.success('Приглашение создано!', {
            description: 'Токен скопирован в буфер обмена',
          });
          navigator.clipboard.writeText(token);
        },
        onError: (error: unknown) => {
          let message = 'Не удалось создать приглашение';
          if (error instanceof Error) {
            const axiosError = error as AxiosError<{ detail?: string }>;
            message = axiosError.response?.data?.detail || error.message || message;
          }
          toast.error('Ошибка', { description: message });
        },
      }
    );
  };


  const handleDelete = (inviteId: string) => {
    if (!familyId || !inviteId) {
      toast.error('Ошибка', { description: 'Не удалось определить группу или приглашение' });
      return;
    }
    deleteInvite({ familyId, inviteId });
  };

  const handleCopy = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      toast.success('Токен скопирован', { description: 'Пригласительный токен в буфере обмена' });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('Не удалось скопировать');
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      viewer: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      editor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      admin: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    };
    const labels = {
      viewer: 'Просмотр',
      editor: 'Редактор',
      admin: 'Админ',
    };
    return (
      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${colors[role as keyof typeof colors]}`}>
        {labels[role as keyof typeof labels]}
      </span>
    );
  };

  const resetCreateTab = () => {
    setCreatedToken(null);
    setEmail('');
    setMaxUses(1);
    setRole('viewer');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetCreateTab();
    }}>
      <DialogContent className="glass-card border-[var(--glass-border)] max-w-2xl p-0 overflow-hidden bg-[var(--glass-bg)] backdrop-blur-xl">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-[var(--primary)] rounded-full blur-[90px] opacity-20 pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-[var(--secondary)] rounded-full blur-[90px] opacity-15 pointer-events-none" />

        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
              <Plus className="w-5 h-5 text-[var(--secondary)]" />
            </div>
            <DialogTitle className="text-2xl font-black text-white tracking-tighter">
              Управление: {familyName}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Вкладки */}
        <div className="flex border-b border-[var(--glass-border)] px-6">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'create' ? 'text-[var(--secondary)]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Создать
            </span>
            {activeTab === 'create' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--secondary)]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'list' ? 'text-[var(--secondary)]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Активные ({invites?.filter(i => i.is_active).length || 0})
            </span>
            {activeTab === 'list' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--secondary)]" />
            )}
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'create' ? (
            createdToken ? (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex flex-col items-center text-center space-y-3 p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
                  <div className="p-3 rounded-full bg-green-500/20 border border-green-500/30">
                    <Check className="w-8 h-8 text-green-400" />
                  </div>
                  <p className="text-green-300 font-semibold">Приглашение создано!</p>
                  <p className="text-green-200/70 text-sm">Токен скопирован в буфер обмена</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Токен приглашения
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={createdToken}
                      readOnly
                      className="font-mono text-sm bg-black/30 border-[var(--glass-border)] text-slate-200 truncate"
                    />
                    <Button
                      onClick={() => handleCopy(createdToken)}
                      variant="outline"
                      size="icon"
                      className="shrink-0 glass-card border-[var(--glass-border)] hover:bg-[var(--glass-bg)]"
                    >
                      <Copy className="w-4 h-4 text-[var(--secondary)]" />
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={resetCreateTab}
                  variant="secondary"
                  className="w-full bg-[var(--glass-bg)] hover:bg-[var(--glass-border)] text-white border border-[var(--glass-border)] rounded-xl h-11"
                >
                  Создать ещё один
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
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

                {/*<div className="space-y-2">*/}
                {/*  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">*/}
                {/*    Email (необязательно)*/}
                {/*  </label>*/}
                {/*  <Input*/}
                {/*    placeholder="user@example.com"*/}
                {/*    value={email}*/}
                {/*    onChange={(e) => setEmail(e.target.value)}*/}
                {/*    className="glass-card border-[var(--glass-border)] bg-[var(--glass-bg)] text-white placeholder:text-slate-500"*/}
                {/*  />*/}
                {/*</div>*/}

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
                  <p className="text-xs text-slate-500">Сколько раз токен может быть использован</p>
                </div>

                <Button
                  onClick={handleCreate}
                  disabled={isCreating}
                  className="w-full bg-[var(--secondary)] hover:bg-cyan-400 text-[var(--secondary-foreground)] font-bold rounded-xl h-12 transition-all duration-300"
                >
                  {isCreating ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Создаём...
                    </span>
                  ) : (
                    'Создать приглашение'
                  )}
                </Button>
              </div>
            )
          ) : (
            isLoading ? (
              <div className="text-center py-8 text-slate-400">Загрузка...</div>
            ) : invites && invites.filter(i => i.is_active).length > 0 ? (
              <div className="space-y-3">
                {invites.filter(inv => inv.is_active).map((invite) => (
                  <div
                    key={invite.id}
                    className="glass-card p-4 rounded-xl border border-[var(--glass-border)] hover:border-[var(--secondary)]/50 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <code className="px-3 py-1.5 bg-black/40 rounded-lg text-sm font-mono text-[var(--secondary)]">
                            {invite.token}
                          </code>
                          <Button
                            onClick={() => handleCopy(invite.token)}
                            variant="ghost"
                            size="icon"
                            className="shrink-0 w-8 h-8"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <span className="flex items-center gap-1.5 text-slate-300">
                            <Shield className="w-4 h-4 text-[var(--primary)]" />
                            {getRoleBadge(invite.assigned_role)}
                          </span>

                          <span className="flex items-center gap-1.5 text-slate-300">
                            <Users className="w-4 h-4 text-[var(--secondary)]" />
                            Использовано: {invite.times_used}/{invite.max_uses}
                          </span>

                          <span className="flex items-center gap-1.5 text-slate-400">
                            <Clock className="w-4 h-4" />
                            {format(new Date(invite.expires_at), 'dd MMM yyyy', { locale: ru })}
                          </span>
                        </div>

                        <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[var(--secondary)] to-[var(--primary)] transition-all"
                            style={{ width: `${(invite.times_used / invite.max_uses) * 100}%` }}
                          />
                        </div>
                      </div>
                        <Button
                        onClick={() => handleDelete(invite.id)}
                        disabled={isPending}
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:text-red-500 hover:bg-red-950/30 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Нет активных приглашений</p>
                <p className="text-sm mt-1">Создайте первое приглашение</p>
              </div>
            )
          )}
        </div>

        <div className="px-6 pb-6 pt-4 border-t border-[var(--glass-border)] flex justify-end">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-[var(--glass-bg)] hover:bg-[var(--glass-border)] text-white border border-[var(--glass-border)]"
          >
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};