import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {ArrowRight, Heart, Home, Key, Plus, ShieldAlert, Trash2, Users} from 'lucide-react';
import {useDeleteFamily, useFamilies} from '@/hooks/useFamilies';
import {useAuth} from '@/hooks/useAuth';
import {CreateFamilyModal} from '@/components/CreateFamilyModal';
import {FamilyTokenModal} from '@/components/FamilyTokenModal';
import {familyApi} from '@/api/family';
import {toast} from 'sonner';
import type {FamilyGroupRead} from '@/types/families';

export const FamiliesPage = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const { data: familiesRaw, isLoading, error, refetch } = useFamilies();
  const { user } = useAuth();
  const { mutate: deleteFamily, isPending: isDeleting } = useDeleteFamily();
  const navigate = useNavigate();

  const families: FamilyGroupRead[] = Array.isArray(familiesRaw)
    ? familiesRaw
    : (familiesRaw as { data?: FamilyGroupRead[] })?.data ?? [];

  const handleDelete = (familyId: string, familyName: string) => {
    if (window.confirm(`Вы уверены, что хотите удалить группу "${familyName}"?`)) {
      deleteFamily(familyId);
    }
  };

  const handleToggleFavorite = async (familyId: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await familyApi.unsetFavoriteFamily();
        toast.success('Избранная группа снята');
      } else {
        await familyApi.setFavoriteFamily(familyId);
        toast.success('Группа добавлена в избранное');
      }
      await refetch();
    } catch {
      toast.error('Ошибка', { description: 'Не удалось изменить избранную группу' });
    }
  };

  const primaryBtnClass =
    "px-6 py-3 gap-2 bg-gradient-to-r from-[var(--secondary)] to-[var(--primary)] hover:from-cyan-400 hover:to-purple-400 text-white font-medium rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all duration-300 hover:-translate-y-0.5 active:scale-95 flex items-center";

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg">Ошибка загрузки семейных групп</p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] text-white hover:bg-white/10 rounded-xl transition-all"
          >
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-white mb-2">
              Семейные группы
            </h1>
            <p className="text-slate-400 text-lg">
              Совместная работа над родословной
            </p>
          </div>

          {/* ✅ Группа кнопок */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              onClick={() => navigate('/')}
              className="px-6 py-3 gap-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] text-white hover:bg-white/10 font-medium rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all duration-300 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center"
            >
              <Home className="w-5 h-5" />
              На главную
            </Button>
            <Button onClick={() => setShowCreateModal(true)} className={primaryBtnClass}>
              <Plus className="w-5 h-5" />
              Создать новую группу
            </Button>
          </div>
        </div>

        {/* Состояние загрузки */}
        {isLoading && (
          <div className="glass-card p-16 text-center">
            <p className="text-slate-400 text-lg">Загрузка семейных групп...</p>
          </div>
        )}

        {/* Пустое состояние */}
        {!isLoading && families.length === 0 && (
          <div className="glass-card p-24 text-center">
            <Users className="w-32 h-32 mx-auto mb-8 text-slate-500" />
            <h3 className="text-4xl font-bold text-white mb-4">
              Нет семейных групп
            </h3>
            <p className="text-slate-400 max-w-xl mx-auto mb-10 text-lg">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {families.map((family) => {
              const memberships = family.memberships ?? [];
              const membership = memberships.find((m) => m.user_id === user?.id);
              const isFamilyAdmin = membership?.role === 'admin';
              const memberCount = memberships.length;
              const isFavorite = membership?.is_favourite ?? false;

              return (
                <div
                  key={family.id}
                  className={`glass-card p-10 hover:border-[var(--primary)]/60 transition-all duration-300 group relative overflow-hidden ${
                    isFavorite ? 'border-[var(--primary)]/60 shadow-[0_0_20px_rgba(168,85,247,0.2)]' : ''
                  }`}
                >
                  {/* Фоновой градиент при наведении */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 to-[var(--secondary)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative z-10">
                    {/* Заголовок карточки */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-3xl font-bold text-white tracking-tight">
                            {family.name}
                          </h3>
                          {isFavorite && (
                            <Heart className="w-6 h-6 text-[var(--primary)] fill-[var(--primary)]" />
                          )}
                        </div>
                        {family.description && (
                          <p className="text-slate-400 mt-3 line-clamp-3 text-base leading-relaxed">
                            {family.description}
                          </p>
                        )}
                      </div>

                      {/* Кнопка управления приглашениями */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => isFamilyAdmin && setSelectedFamilyId(family.id)}
                        disabled={!isFamilyAdmin}
                        className={`w-12 h-12 rounded-xl transition-all ${
                          isFamilyAdmin
                            ? 'text-slate-400 hover:text-white hover:bg-[var(--glass-bg)]'
                            : 'opacity-40 cursor-not-allowed text-slate-600'
                        }`}
                        title={isFamilyAdmin ? 'Управление приглашениями' : 'Только администратор'}
                      >
                        <Key className="w-6 h-6" />
                      </Button>
                    </div>

                    {/* Статистика и действия */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--glass-border)]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-white">{memberCount}</p>
                          <p className="text-sm text-slate-400">
                            {memberCount === 1 ? 'участник' : memberCount <= 4 ? 'участника' : 'участников'} с доступом
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 items-center">
                        {/* ✅ КНОПКА ИЗБРАННОГО с тултипом */}
                        <div className="group/favorite relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleFavorite(family.id, isFavorite)}
                            className={`w-10 h-10 rounded-xl transition-all ${
                              isFavorite
                                ? 'text-[var(--primary)] hover:text-[var(--primary)]/80 bg-[var(--primary)]/10'
                                : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
                            }`}
                            title={isFavorite ? 'Убрать из избранного' : 'Сделать избранной группой'}
                          >
                            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                          </Button>

                          {/* ✅ Тултип с пояснением */}
                          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 w-64 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs text-slate-300 shadow-xl opacity-0 invisible group-hover/favorite:opacity-100 group-hover/favorite:visible transition-all duration-200 pointer-events-none z-50">
                            <p className="font-semibold text-white mb-1">
                              {isFavorite ? 'Избранная группа' : 'Сделать избранной'}
                            </p>
                            <p className="leading-relaxed">
                              {isFavorite
                                ? 'Информация по этой группе отображается на главной странице'
                                : 'Нажмите, чтобы эта группа отображалась на главной странице'}
                            </p>
                            <div className="absolute top-full right-4 border-4 border-transparent border-t-[var(--glass-bg)]" />
                          </div>
                        </div>

                        {/* Кнопка перехода на дерево */}
                        <Button
                          onClick={() => navigate(`/family/${family.id}`)}
                          className="bg-[var(--secondary)] hover:bg-cyan-400 text-[var(--secondary-foreground)] rounded-xl px-5 py-2.5 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                        >
                          Открыть древо
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>

                        {isFamilyAdmin ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isDeleting}
                            className="text-red-400 hover:text-red-500 hover:bg-red-950/30 disabled:opacity-50 transition-all rounded-xl px-4 py-2.5"
                            onClick={() => handleDelete(family.id, family.name)}
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-amber-400/80 bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20">
                            <ShieldAlert className="w-4 h-4" />
                            <span>Ограниченные права</span>
                          </div>
                        )}
                      </div>
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
      <FamilyTokenModal
        open={!!selectedFamilyId}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedFamilyId(null);
        }}
        familyId={selectedFamilyId || ''}
        familyName={families.find((f) => f.id === selectedFamilyId)?.name || ''}
      />
    </div>
  );
};