import {useState} from 'react';
import {Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {ChevronRight, Plus, Users, X} from 'lucide-react';
import {useMyFamilies} from '@/hooks/useFamilies';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (familyId: string) => void;
}

export const SelectFamilyModal = ({ open, onOpenChange, onSelect }: Props) => {
  const {  families = [], isLoading } = useMyFamilies();
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);

  const handleContinue = () => {
    if (selectedFamily) {
      onSelect(selectedFamily);
      onOpenChange(false);
      setSelectedFamily(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="glass-card border-[var(--glass-border)] max-w-md p-0 overflow-hidden bg-[var(--glass-bg)] backdrop-blur-xl [&>button]:hidden"
      >
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-[var(--primary)] rounded-full blur-[90px] opacity-20 pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-[var(--secondary)] rounded-full blur-[90px] opacity-15 pointer-events-none" />

        <DialogHeader className="px-6 pt-6 pb-2 relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
              <Users className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <DialogTitle className="text-2xl font-black text-white tracking-tighter">
              Выберите семейную группу
            </DialogTitle>
          </div>
          <p className="text-sm text-slate-400">
            В какую группу добавить нового родственника?
          </p>

          <DialogClose className="absolute right-6 top-6 p-2 rounded-full hover:bg-[var(--glass-bg)] hover:text-white transition-colors outline-none z-20">
            <X className="w-5 h-5 text-slate-400" />
          </DialogClose>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4 relative z-10">
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Загрузка...</div>
          ) : families.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-slate-400">У вас пока нет семейных групп</p>
              <Button
                onClick={() => onOpenChange(false)}
                className="bg-[var(--secondary)] hover:bg-cyan-400 text-[var(--secondary-foreground)] rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Создать группу
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {families.map((family) => (
                <button
                  key={family.id}
                  onClick={() => setSelectedFamily(family.id)}
                  className={`w-full p-4 rounded-xl border transition-all duration-200 flex items-center justify-between group ${
                    selectedFamily === family.id
                      ? 'bg-[var(--primary)]/20 border-[var(--primary)] shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                      : 'bg-white/5 border-[var(--glass-border)] hover:bg-white/10 hover:border-[var(--primary)]/50'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0 text-left">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedFamily === family.id
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-gradient-to-br from-purple-500 to-cyan-400 text-white'
                    }`}>
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold truncate ${
                        selectedFamily === family.id ? 'text-white' : 'text-slate-200'
                      }`}>
                        {family.name}
                      </p>
                      {family.description && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {family.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 transition-colors ${
                    selectedFamily === family.id ? 'text-[var(--primary)]' : 'text-slate-500 group-hover:text-slate-300'
                  }`} />
                </button>
              ))}
            </div>
          )}

          {selectedFamily && (
            <Button
              onClick={handleContinue}
              className="w-full bg-[var(--secondary)] hover:bg-cyan-400 text-[var(--secondary-foreground)] font-bold rounded-xl h-12 transition-all duration-300 shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)]"
            >
              Продолжить
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};