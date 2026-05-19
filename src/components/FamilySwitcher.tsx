import {useFamilies} from '@/hooks/useFamilies';
import {useAuth} from '@/hooks/useAuth';
import {Button} from '@/components/ui/button';
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from '@/components/ui/dropdown-menu';
import {ChevronDown, Heart, Users} from 'lucide-react';
import type {UUID} from '@/types/common';
import type {FamilyGroupRead, FamilyMembershipRead} from '@/types/families';

interface FamilySwitcherProps {
  selectedFamilyId: UUID | null;
  onSelectFamily: (familyId: UUID) => void;
  showOnlyWithAccess?: boolean;
}

export const FamilySwitcher: React.FC<FamilySwitcherProps> = ({
  selectedFamilyId,
  onSelectFamily,
  showOnlyWithAccess = true,
}) => {
  const { data: familiesRaw, isLoading } = useFamilies();
  const { user } = useAuth();

  const families: FamilyGroupRead[] = Array.isArray(familiesRaw)
    ? familiesRaw
    : (familiesRaw as { data?: FamilyGroupRead[] })?.data ?? [];

  const accessibleFamilies = showOnlyWithAccess
    ? families.filter((family: FamilyGroupRead) =>
        family.memberships?.some((m: FamilyMembershipRead) => m.user_id === user?.id)
      )
    : families;

  const selectedFamily = accessibleFamilies.find((f: FamilyGroupRead) => f.id === selectedFamilyId);

  if (isLoading) {
    return (
      <Button variant="outline" disabled className="gap-2 bg-slate-800 border-slate-700">
        <Users className="w-4 h-4" />
        Загрузка...
        <ChevronDown className="w-4 h-4" />
      </Button>
    );
  }

  if (accessibleFamilies.length === 0) {
    return (
      <Button variant="outline" disabled className="gap-2 bg-slate-800 border-slate-700">
        <Users className="w-4 h-4" />
        Нет семей
        <ChevronDown className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 bg-slate-800 border-slate-700 hover:bg-slate-700">
          <Users className="w-4 h-4" />
          {selectedFamily ? selectedFamily.name : 'Выберите семью'}
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-slate-800 border-slate-700">
        {accessibleFamilies.map((family: FamilyGroupRead) => {
          const isFavorite = family.memberships?.some(
            (m: FamilyMembershipRead) => m.is_favourite === true
          );
          return (
            <DropdownMenuItem
              key={family.id}
              onClick={() => onSelectFamily(family.id)}
              className={`cursor-pointer hover:bg-slate-700 ${
                selectedFamilyId === family.id ? 'bg-slate-700' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                {isFavorite && <Heart className="w-4 h-4 text-[var(--primary)]" />}
                <span>{family.name}</span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};