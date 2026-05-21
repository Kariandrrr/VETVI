import {useEffect, useState} from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Label} from '@/components/ui/label';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {toast} from 'sonner';
import {axiosInstance} from '@/api/auth';
import type {UUID} from '@/types/common';
import type {FamilyMember, Relationship} from '@/types/families';
import {Link2, Loader2, Users} from 'lucide-react';

type RelationshipTypeValue = 'parent_child' | 'spouse' | 'sibling';

interface RelationshipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyGroupId: UUID;
  members: FamilyMember[];
  existingRelationships: Relationship[];
  onSuccess: () => void;
}

const relationshipTypes: { value: RelationshipTypeValue; label: string; description: string; icon: string }[] = [
  { value: 'parent_child', label: 'Родитель-Ребёнок', description: 'Установить родственную связь', icon: '👨‍👧' },
  { value: 'spouse', label: 'Супруг(а)', description: 'Установить брачную связь', icon: '💑' },
  { value: 'sibling', label: 'Брат/Сестра', description: 'Установить связь брата/сестры', icon: '👥' },
];

const QuickFamilyCreator = ({
  members,
  familyGroupId,
  onSuccess,
  onCancel
}: {
  members: FamilyMember[];
  familyGroupId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const [fatherId, setFatherId] = useState<string>('');
  const [motherId, setMotherId] = useState<string>('');
  const [childId, setChildId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const memberOptions = members.filter(m => m && m.id).map(m => ({
    id: m.id,
    name: `${m.first_name} ${m.last_name}`.trim() || 'Без имени',
    gender: m.gender,
  }));

  const handleSubmit = async () => {
    if (!childId) {
      toast.error('Выберите ребенка');
      return;
    }

    setIsSubmitting(true);
    const relationshipsToCreate = [];

    if (fatherId) {
      relationshipsToCreate.push({
        from_member_id: fatherId,
        to_member_id: childId,
        rel_type: 'parent_child',
      });
    }

    if (motherId) {
      relationshipsToCreate.push({
        from_member_id: motherId,
        to_member_id: childId,
        rel_type: 'parent_child',
      });
    }

    if (fatherId && motherId) {
      relationshipsToCreate.push({
        from_member_id: fatherId,
        to_member_id: motherId,
        rel_type: 'spouse',
      });
    }

    if (relationshipsToCreate.length === 0) {
      toast.error('Выберите хотя бы одного родителя');
      setIsSubmitting(false);
      return;
    }

    for (let i = 0; i < relationshipsToCreate.length; i++) {
      const rel = relationshipsToCreate[i];
      setCurrentStep(i + 1);

      try {
        await axiosInstance.post('/families/relationships', {
          family_group_id: familyGroupId,
          ...rel,
        });
      } catch (error) {
        console.error('Create relationship error:', error);
        toast.error(`Ошибка при создании связи ${i + 1}/${relationshipsToCreate.length}`);
        setIsSubmitting(false);
        return;
      }
    }

    toast.success(`Успешно создано ${relationshipsToCreate.length} связей`);
    onSuccess();
    onCancel();
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-slate-300">Отец (опционально)</Label>
        <Select value={fatherId} onValueChange={setFatherId}>
          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
            <SelectValue placeholder="Выберите отца" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="" className="text-slate-400">Не выбран</SelectItem>
            {memberOptions
              .filter(m => m.gender === 'male')
              .map((m) => (
                <SelectItem key={m.id} value={m.id} className="text-slate-300">
                  {m.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Мать (опционально)</Label>
        <Select value={motherId} onValueChange={setMotherId}>
          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
            <SelectValue placeholder="Выберите мать" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="" className="text-slate-400">Не выбрана</SelectItem>
            {memberOptions
              .filter(m => m.gender === 'female')
              .map((m) => (
                <SelectItem key={m.id} value={m.id} className="text-slate-300">
                  {m.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Ребенок</Label>
        <Select value={childId} onValueChange={setChildId}>
          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
            <SelectValue placeholder="Выберите ребенка" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            {memberOptions.map((m) => (
              <SelectItem key={m.id} value={m.id} className="text-slate-300">
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isSubmitting && (
        <div className="text-center text-slate-400 text-sm">
          <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
          Создание связей... ({currentStep}/{fatherId && motherId ? 3 : fatherId || motherId ? 2 : 0})
        </div>
      )}

      <div className="flex gap-2 justify-end pt-4">
        <Button variant="outline" onClick={onCancel} className="bg-slate-800 border-slate-700">
          Отмена
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-gradient-to-r from-emerald-400 to-cyan-400">
          {isSubmitting ? 'Создание...' : 'Создать связи'}
        </Button>
      </div>
    </div>
  );
};

export const RelationshipModal: React.FC<RelationshipModalProps> = ({
  open,
  onOpenChange,
  familyGroupId,
  members,
  existingRelationships,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'single' | 'family'>('single');
  const [fromMemberId, setFromMemberId] = useState<string>('');
  const [toMemberId, setToMemberId] = useState<string>('');
  const [relType, setRelType] = useState<RelationshipTypeValue>('parent_child');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const resetForm = () => {
    setFromMemberId('');
    setToMemberId('');
    setRelType('parent_child');
  };

  useEffect(() => {
    if (!open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
      resetForm();
      setActiveTab('single');
    }
  }, [open]);

  const memberMap = new Map<string, FamilyMember>();
  members.forEach(m => {
    if (m && m.id) {
      memberMap.set(m.id, m);
    }
  });

  const memberOptions = members.filter(m => m && m.id).map(m => ({
    id: m.id,
    name: `${m.last_name} ${m.first_name} ${m.patronymic || ''}`.trim() || 'Без имени',
  }));

  const getMemberName = (memberId: string): string => {
    const member = memberMap.get(memberId);
    if (!member) {
      return 'Неизвестный';
    }
    return `${member.first_name} ${member.last_name}`.trim() || 'Без имени';
  };

  const getRelationTypeText = (type: string) => {
    switch (type) {
      case 'parent_child': return 'Родитель-Ребёнок';
      case 'spouse': return 'Супруг(а)';
      case 'sibling': return 'Брат/Сестра';
      default: return type;
    }
  };

  const handleSubmit = async () => {
    if (!fromMemberId || !toMemberId) {
      toast.error('Выберите обоих участников');
      return;
    }

    if (fromMemberId === toMemberId) {
      toast.error('Нельзя установить связь с самим собой');
      return;
    }

    setIsSubmitting(true);

    try {
      await axiosInstance.post('/families/relationships', {
        family_group_id: familyGroupId,
        from_member_id: fromMemberId,
        to_member_id: toMemberId,
        rel_type: relType,
      });

      toast.success('Связь успешно добавлена');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Create relationship error:', error);
      const err = error as { response?: { data?: { detail?: string } } };
      const detail = err.response?.data?.detail;
      toast.error(detail || 'Ошибка при создании связи');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRelationship = async (relationshipId: string) => {
    if (!confirm('Удалить эту связь?')) return;

    setDeletingId(relationshipId);
    try {
      await axiosInstance.delete(`/families/relationships/${relationshipId}`);
      toast.success('Связь удалена');
      onSuccess();
    } catch (error) {
      console.error('Delete relationship error:', error);
      toast.error('Ошибка при удалении связи');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Управление связями</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'single' | 'family')}>
          <TabsList className="grid w-full grid-cols-2 bg-slate-800">
            <TabsTrigger value="single" className="data-[state=active]:bg-slate-700">
              <Link2 className="w-4 h-4 mr-2" />
              Одиночная связь
            </TabsTrigger>
            <TabsTrigger value="family" className="data-[state=active]:bg-slate-700">
              <Users className="w-4 h-4 mr-2" />
              Быстрое создание семьи
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Тип связи</Label>
              <Select value={relType} onValueChange={(v) => setRelType(v as RelationshipTypeValue)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {relationshipTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-slate-300">
                      <div className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        <div>
                          <div>{type.label}</div>
                          <div className="text-xs text-slate-500">{type.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Участник 1</Label>
              <Select value={fromMemberId} onValueChange={setFromMemberId}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Выберите участника" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                  {memberOptions.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-slate-300">
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Участник 2</Label>
              <Select value={toMemberId} onValueChange={setToMemberId}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Выберите участника" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                  {memberOptions.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-slate-300">
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-slate-800 border-slate-700">
                Отмена
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-gradient-to-r from-emerald-400 to-cyan-400">
                {isSubmitting ? 'Сохранение...' : 'Добавить связь'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="family" className="py-4">
            <QuickFamilyCreator
              members={members}
              familyGroupId={familyGroupId}
              onSuccess={onSuccess}
              onCancel={() => onOpenChange(false)}
            />
          </TabsContent>
        </Tabs>

        {existingRelationships.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <Label className="text-slate-300 mb-2 block">Существующие связи</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {existingRelationships.map((rel) => {
                const fromName = getMemberName(rel.source_id);
                const toName = getMemberName(rel.target_id);
                return (
                  <div key={rel.id} className="flex items-center justify-between p-2 rounded bg-slate-800/50">
                    <span className="text-sm text-slate-300">
                      {fromName} → {toName}
                      <span className="text-xs text-slate-500 ml-2">
                        ({getRelationTypeText(rel.relationship_type)})
                      </span>
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteRelationship(rel.id)}
                      disabled={deletingId === rel.id}
                      className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                    >
                      {deletingId === rel.id ? <Loader2 className="w-3 h-3 animate-spin" /> : '✕'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};