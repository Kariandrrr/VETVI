import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {useCreateFamily} from '../hooks/useFamilies';
import {toast} from 'sonner';
import {AxiosError} from 'axios';
import {Loader2, Plus, Sparkles, X} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateFamilyModal = ({ open, onOpenChange }: Props) => {
    const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { mutate, isPending } = useCreateFamily();


  const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Ошибка', { description: 'Введите название группы' });
      return;
    }
    mutate({ name, description }, {
      onSuccess: () => {
        toast.success('🎉 Группа создана!', {
          description: 'Семейная группа успешно добавлена в архив',
          duration: 3000,
        });
        setName('');
        setDescription('');
        onOpenChange(false);
      },
      onError: (error: unknown) => {
        let msg = 'Не удалось создать группу';
        if (error instanceof Error) {
          const axiosErr = error as AxiosError<{ detail?: string }>;
          msg = axiosErr.response?.data?.detail || error.message || msg;
        }
        toast.error('❌ Ошибка', {
          description: msg,
          duration: 4000,
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-[var(--glass-border)] max-w-md p-0 overflow-hidden bg-[var(--glass-bg)] backdrop-blur-xl">
        {/* Фоновые неоновые акценты */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-[var(--primary)] rounded-full blur-[90px] opacity-20 pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-[var(--secondary)] rounded-full blur-[90px] opacity-15 pointer-events-none" />

        {/* Заголовок */}
        <DialogHeader className="px-6 pt-6 pb-2 relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
              <Sparkles className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <DialogTitle className="text-2xl font-black text-white tracking-tighter">
              Создать семейную группу
            </DialogTitle>
          </div>
          <p className="text-sm text-slate-400">
            Заполните информацию для создания нового семейного архива
          </p>

          <DialogClose className="absolute right-6 top-6 p-2 rounded-full hover:bg-[var(--glass-bg)] hover:text-white transition-colors outline-none">
            <X className="w-5 h-5 text-slate-400" />
          </DialogClose>
        </DialogHeader>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5 relative z-10">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Название группы
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Семья Ивановых"
              className="glass-card border-[var(--glass-border)] bg-[var(--glass-bg)] text-white placeholder:text-slate-500 focus-visible:ring-[var(--primary)]"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Описание (необязательно)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Родословная нашей семьи, история происхождения..."
              className="glass-card border-[var(--glass-border)] bg-[var(--glass-bg)] text-white placeholder:text-slate-500 resize-none h-24 focus-visible:ring-[var(--primary)]"
              disabled={isPending}
            />
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-[var(--secondary)] hover:bg-cyan-400 text-[var(--secondary-foreground)] font-bold rounded-xl h-12 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Создаём...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Создать группу
              </span>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};