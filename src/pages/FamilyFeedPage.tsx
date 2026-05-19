import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {FamilyFeed} from '@/components/FamilyFeed';
import {FamilySwitcher} from '@/components/FamilySwitcher';
import {useFamilies} from '@/hooks/useFamilies';
import {useAuth} from '@/hooks/useAuth';
import {Button} from '@/components/ui/button';
import {ArrowLeftIcon} from 'lucide-react';
import type {UUID} from '@/types/common';
import type {FamilyGroupRead, FamilyMembershipRead} from '@/types/families';

export const FamilyFeedPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: familiesRaw } = useFamilies();

  const families: FamilyGroupRead[] = Array.isArray(familiesRaw)
    ? familiesRaw
    : (familiesRaw as { data?: FamilyGroupRead[] })?.data ?? [];

  const favoriteFamily = families.find((family: FamilyGroupRead) =>
    family.memberships?.some((m: FamilyMembershipRead) => m.user_id === user?.id && m.is_favourite === true)
  );

  const [selectedFamilyId, setSelectedFamilyId] = useState<UUID | null>(() => {
    const saved = localStorage.getItem('selectedFamilyForFeed');
    if (saved) return saved as UUID;
    return favoriteFamily?.id || null;
  });

  useEffect(() => {
    if (selectedFamilyId) {
      localStorage.setItem('selectedFamilyForFeed', selectedFamilyId);
    }
  }, [selectedFamilyId]);

  useEffect(() => {
    if (!selectedFamilyId && favoriteFamily?.id) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedFamilyId(favoriteFamily.id);
    }
  }, [favoriteFamily?.id, selectedFamilyId]);

  const handleSelectFamily = (familyId: UUID) => {
    setSelectedFamilyId(familyId);
  };

  if (!selectedFamilyId && !favoriteFamily) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="glass-card p-12 text-center max-w-md">
          <h3 className="text-xl font-bold text-white mb-2">Нет семей</h3>
          <p className="text-slate-400 mb-6">
            У вас пока нет семейных групп. Создайте или присоединитесь к семье, чтобы видеть ленту.
          </p>
          <Button onClick={() => navigate('/families')} variant="outline">
            Перейти к семейным группам
          </Button>
        </div>
      </div>
    );
  }

  const activeFamilyId = selectedFamilyId || favoriteFamily?.id;
  if (!activeFamilyId) return null;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-[1000px] mx-auto px-6 py-8">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full w-10 h-10 text-slate-400 hover:text-white"
              onClick={() => navigate('/')}
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tighter">
                Семейная лента
              </h1>
              <p className="text-slate-400 mt-1">
                Публикации и новости вашей семьи
              </p>
            </div>
          </div>

          <FamilySwitcher
            selectedFamilyId={activeFamilyId}
            onSelectFamily={handleSelectFamily}
          />
        </div>

        <FamilyFeed familyGroupId={activeFamilyId} />
      </div>
    </div>
  );
};