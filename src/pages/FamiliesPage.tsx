import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Users, Share2, Trash2, ShieldAlert } from 'lucide-react';
import { useFamilies, useDeleteFamily } from '@/hooks/useFamilies';
import { useAuth } from '@/hooks/useAuth'; // ✅ Добавили хук для получения юзера
import { CreateFamilyModal } from '@/components/CreateFamilyModal'; // ✅ Не забудьте импортировать, если используется
import { InviteModal } from '@/components/InviteModal';
import type { FamilyGroupRead } from '@/types/families';

export const FamiliesPage = () => {
  // ✅ Исправлена деструктуризация useState
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFamilyForInvite, setSelectedFamilyForInvite] = useState<string | null>(null);

  // ✅ Исправлено: 'data' переименована в 'familiesRaw' для ясности
  const { data: familiesRaw, isLoading, error } = useFamilies();

  // ✅ Получаем текущего пользователя для проверки прав
  const { user } = useAuth();

  const { mutate: deleteFamily, isPending: isDeleting } = useDeleteFamily();

  // ✅ Безопасно извлекаем массив из AxiosResponse
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

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg">Ошибка загрузки семейных групп</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
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
              Семейные Группы
            </h1>
            <p className="text-slate-400 mt-1">
              Совместная работа над родословной
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="gap-2 bg-[var(--secondary)] hover:bg-cyan-300 text-[var(--secondary-foreground)]"
          >
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
            <Button onClick={() => setShowCreateModal(true)} size="lg">
              Создать первую группу
            </Button>
          </div>
        )}

        {/* Список групп */}
        {!isLoading && families.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {families.map((family) => {
              // Проверка роли (используем 'any', если типы фронтенда еще не обновлены до memberships)
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

                    {/* ✅ Кнопка доступна только админам */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => isFamilyAdmin && openInviteModal(family.id)}
                      disabled={!isFamilyAdmin}
                      className={`text-slate-400 hover:text-white ${!isFamilyAdmin && 'opacity-40 cursor-not-allowed'}`}
                      title={isFamilyAdmin ? 'Пригласить участника' : 'Только администратор'}
                    >
                      <Share2 className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--glass-border)]">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Users className="w-4 h-4" />
                      <span>{memberCount} участников</span>
                    </div>

                    <div className="flex gap-2 items-center">
                      {isFamilyAdmin ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openInviteModal(family.id)}
                          >
                            Пригласить
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isDeleting}
                            className="text-red-400 hover:text-red-500 hover:bg-red-950/30 disabled:opacity-50"
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
      <CreateFamilyModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />

      {/* ✅ Один InviteModal вместо двух */}
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