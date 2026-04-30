import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCreateFamily } from '../hooks/useFamilies';
import type {FamilyGroupCreate} from '@/types/families';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateFamilyModal = ({ open, onOpenChange }: Props) => {
  const [data, setData] = useState<FamilyGroupCreate>({ name: '', description: '' });
  const { mutate, isPending } = useCreateFamily();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.name.trim()) return;

    mutate(data, {
      onSuccess: () => {
        setData({ name: '', description: '' });
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-[var(--glass-border)]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Создать семейную группу</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Название группы</label>
            <Input
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              placeholder="Например: Семья Ивановых"
              className="bg-black/50"
              required
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1 block">Описание (необязательно)</label>
            <Textarea
              value={data.description}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              placeholder="Родословная нашей семьи..."
              className="bg-black/50 resize-none h-24"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Создаём...' : 'Создать группу'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};