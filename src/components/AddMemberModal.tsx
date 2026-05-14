import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, Loader2, UserPlus, X, Heart, Skull } from 'lucide-react';
import { familyApi } from '@/api/family';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

interface Props {
  familyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddSuccess?: () => void;
}

type MemberType = 'alive_without_account' | 'deceased';

interface CreateMemberData {
  family_group_id: string;
  first_name: string;
  last_name: string;
  linked_user_id: null;
  is_alive?: boolean;
  patronymic?: string | null;
}

export const AddMemberModal = ({ familyId, open, onOpenChange, onAddSuccess }: Props) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [patronymic, setPatronymic] = useState('');
  const [memberType, setMemberType] = useState<MemberType>('alive_without_account');
  const [isPending, setIsPending] = useState(false);

  const handleCreate = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Ошибка валидации', {
        description: 'Имя и фамилия обязательны для заполнения'
      });
      return;
    }

    setIsPending(true);
    try {
      const isAlive = memberType !== 'deceased';

      const requestData: CreateMemberData = {
        family_group_id: familyId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        linked_user_id: null,
        is_alive: isAlive,
      };

      if (patronymic.trim()) {
        requestData.patronymic = patronymic.trim();
      }

      await familyApi.createMember(requestData);

      const statusText = memberType === 'deceased'
        ? 'умершего родственника'
        : 'живого родственника (без аккаунта)';

      toast.success('Родственник добавлен', {
        description: `${lastName} ${firstName} добавлен как ${statusText}`,
      });

      setFirstName('');
      setLastName('');
      setPatronymic('');
      setMemberType('alive_without_account');
      onAddSuccess?.();
      onOpenChange(false);
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string }>;
      toast.error('Не удалось добавить', {
        description: axiosError.response?.data?.detail || 'Произошла ошибка сервера',
        duration: 4000,
      });
    } finally {
      setIsPending(false);
    }
  };

  const getTypeDescription = () => {
    switch (memberType) {
      case 'alive_without_account':
        return 'Будет добавлен вручную, без возможности входа';
      case 'deceased':
        return 'Профиль умершего родственника';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-[var(--glass-border)] max-w-md p-0 overflow-hidden bg-[var(--glass-bg)] backdrop-blur-xl">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-[var(--primary)] rounded-full blur-[90px] opacity-20 pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-[var(--secondary)] rounded-full blur-[90px] opacity-15 pointer-events-none" />

        <DialogHeader className="px-6 pt-6 pb-2 relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
              <UserPlus className="w-5 h-5 text-[var(--secondary)]" />
            </div>
            <DialogTitle className="text-2xl font-black text-white tracking-tighter">
              Новый родственник
            </DialogTitle>
          </div>

          <DialogClose className="absolute right-6 top-6 p-2 rounded-full hover:bg-[var(--glass-bg)] hover:text-white transition-colors outline-none">
            <X className="w-5 h-5 text-slate-400" />
          </DialogClose>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5 relative z-10">
          {/* Выбор типа родственника */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Тип родственника
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMemberType('alive_without_account')}
                className={`p-3 rounded-xl border transition-all duration-200 flex flex-col items-center gap-1 ${
                  memberType === 'alive_without_account'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-slate-400 hover:text-white'
                }`}
              >
                <Heart className="w-5 h-5" />
                <span className="text-xs">Жив(а)</span>
                <span className="text-[10px] opacity-70">без аккаунта</span>
              </button>

              <button
                type="button"
                onClick={() => setMemberType('deceased')}
                className={`p-3 rounded-xl border transition-all duration-200 flex flex-col items-center gap-1 ${
                  memberType === 'deceased'
                    ? 'border-slate-500 bg-slate-500/10 text-slate-400'
                    : 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-slate-400 hover:text-white'
                }`}
              >
                <Skull className="w-5 h-5" />
                <span className="text-xs">Умер(ла)</span>
                <span className="text-[10px] opacity-70">без аккаунта</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">{getTypeDescription()}</p>
          </div>

          {/* Поля ФИО */}
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Фамилия *
              </label>
              <Input
                placeholder="Иванов"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="glass-card border-[var(--glass-border)] bg-[var(--glass-bg)] text-white placeholder:text-slate-500 h-12"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Имя *
              </label>
              <Input
                placeholder="Иван"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="glass-card border-[var(--glass-border)] bg-[var(--glass-bg)] text-white placeholder:text-slate-500 h-12"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Отчество
              </label>
              <Input
                placeholder="Иванович"
                value={patronymic}
                onChange={(e) => setPatronymic(e.target.value)}
                className="glass-card border-[var(--glass-border)] bg-[var(--glass-bg)] text-white placeholder:text-slate-500 h-12"
              />
            </div>
          </div>

          {/* Информационное сообщение */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/90 leading-relaxed">
              <span className="font-semibold">Внимание:</span> Этот родственник {memberType === 'deceased' ? 'умер' : 'не имеет учётной записи'}.
              Его профиль сможет редактировать только администратор семьи.
            </p>
          </div>

          <Button
            onClick={handleCreate}
            disabled={isPending}
            className={`w-full font-bold rounded-xl h-12 transition-all duration-300 shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] ${
              memberType === 'deceased'
                ? 'bg-slate-600 hover:bg-slate-500'
                : 'bg-[var(--secondary)] hover:bg-cyan-400'
            } text-white`}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Добавляем...
              </span>
            ) : (
              `Добавить ${memberType === 'deceased' ? 'умершего' : 'родственника'}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};