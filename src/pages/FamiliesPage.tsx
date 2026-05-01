import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Users, Share2, Trash2, ShieldAlert, Key } from 'lucide-react';
import { useFamilies, useDeleteFamily } from '@/hooks/useFamilies';
import { useAuth } from '@/hooks/useAuth';
import { CreateFamilyModal } from '@/components/CreateFamilyModal';
import { FamilyTokenModal } from '@/components/FamilyTokenModal';
import { InviteModal } from '@/components/InviteModal';
import type { FamilyGroupRead } from '@/types/families';

export const FamiliesPage = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFamilyForInvite, setSelectedFamilyForInvite] = useState<string | null>(null);
  const [selectedFamilyForToken, setSelectedFamilyForToken] = useState<string | null>(null);


  const { data: familiesRaw, isLoading, error } = useFamilies();

  const { user } = useAuth();

  const { mutate: deleteFamily, isPending: isDeleting } = useDeleteFamily();

  const families: FamilyGroupRead[] = Array.isArray(familiesRaw)
    ? familiesRaw
    : (familiesRaw as { data?: FamilyGroupRead[] })?.data ?? [];

  const handleDelete = (familyId: string, familyName: string) => {
    if (window.confirm(`Вы уверены, что хотите удалить группу "${familyName}"?`)) {
      deleteFamily(familyId);
    }
  };

  const openInviteModal = (familyId: string) => {
    setSelectedFamilyForInvite(familyId);
  };

  const primaryBtnClass =
    "px-6 py-3 gap-2 bg-gradient-to-r from-[var(--secondary)] to-[var(--primary)] hover:from-cyan-400 hover:to-purple-400 text-white font-medium rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all duration-300 hover:-translate-y-0.5 active:scale-95 flex items-center";

  const secondaryBtnClass =
    "px-4 py-2 bg-white/5 border-[var(--glass-border)] hover:bg-[var(--primary)]/20 hover:border-[var(--primary)] text-white rounded-lg transition-all duration-200 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:-translate-y-0.5";

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg">Ошибка загрузки семейных групп</p>
          <Button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] text-white hover:bg-white/10 rounded-xl transition-all">
            Перезагрузить
          </Button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[var(--background)] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-white">
              Семейные группы
            </h1>
            <p className="text-slate-400 mt-1">
              Совместная работа над родословной
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className={primaryBtnClass}>
            <Plus className="w-5 h-5" />
            Создать новую группу
          </Button>
        </div>

        {/* Состояние загрузки */}
        {isLoading && (
          <div className="glass-card p-12 text-center">
            <p className="text-slate-400">Загрузка семейных групп...</p>
          </div>
        )}

        {/* Пустое состояние */}
        {!isLoading && families.length === 0 && (
          <div className="glass-card p-20 text-center">
            <Users className="w-24 h-24 mx-auto mb-6 text-slate-500" />
            <h3 className="text-3xl font-semibold text-white mb-3">
              Нет семейных групп
            </h3>
            <p className="text-slate-400 max-w-md mx-auto mb-8">
              Создайте первую группу, чтобы приглашать родственников и вместе работать над семейным деревом
            </p>
            <Button onClick={() => setShowCreateModal(true)} size="lg" className={primaryBtnClass}>
              <Plus className="w-5 h-5" />
              Создать первую группу
            </Button>
          </div>
        )}

        {/* Список групп */}
        {!isLoading && families.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {families.map((family) => {
              const memberships = family.memberships ?? [];
              const membership = memberships.find((m) => m.user_id === user?.id);
              const isFamilyAdmin = membership?.role === 'admin';
              const memberCount = memberships.length;

              return (
                <div
                  key={family.id}
                  className="glass-card p-6 hover:border-[var(--primary)]/50 transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white tracking-tight">
                        {family.name}
                      </h3>
                      {family.description && (
                        <p className="text-slate-400 mt-2 line-clamp-3 text-sm">
                          {family.description}
                        </p>
                      )}
                    </div>

                    {/* Кнопка шаринга */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => isFamilyAdmin && openInviteModal(family.id)}
                      disabled={!isFamilyAdmin}
                      className={`text-slate-400 hover:text-white ${!isFamilyAdmin && 'opacity-40 cursor-not-allowed'} transition-all`}
                      title={isFamilyAdmin ? 'Пригласить участника' : 'Только администратор'}
                    >
                      <Share2 className="w-5 h-5" />
                    </Button>
                      <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedFamilyForToken(family.id)}
                          disabled={!isFamilyAdmin}
                          className={`text-slate-400 hover:text-white ${!isFamilyAdmin && 'opacity-40 cursor-not-allowed'} transition-all`}
                          title={isFamilyAdmin ? 'Пригласительная ссылка' : 'Только администратор'}
                        >
                          <Key className="w-5 h-5" />
                        </Button>
                      <FamilyTokenModal
                          open={!!selectedFamilyForToken}
                          onOpenChange={(isOpen) => {
                            if (!isOpen) setSelectedFamilyForToken(null);
                          }}
                          familyId={selectedFamilyForToken || ''}
                          familyName={families.find(f => f.id === selectedFamilyForToken)?.name || ''}
                          token={null}
                        />
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--glass-border)]">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Users className="w-4 h-4" />
                      <span>{memberCount} участников</span>
                    </div>

                    <div className="flex gap-2 items-center">
                      {isFamilyAdmin ? (
                        <>
                          <Button variant="outline" size="sm" onClick={() => openInviteModal(family.id)} className={secondaryBtnClass}>
                            Пригласить
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isDeleting}
                            className="text-red-400 hover:text-red-500 hover:bg-red-950/30 disabled:opacity-50 transition-all rounded-lg px-3 py-2"
                            onClick={() => handleDelete(family.id, family.name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-amber-400/80 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Ограниченные права</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>


      {/* Модальные окна */}
      <CreateFamilyModal open={showCreateModal} onOpenChange={setShowCreateModal} />
      <InviteModal
        familyId={selectedFamilyForInvite || ''}
        open={!!selectedFamilyForInvite}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedFamilyForInvite(null);
        }}
      />
    </div>
  );
};