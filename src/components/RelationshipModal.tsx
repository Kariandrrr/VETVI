import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { axiosInstance } from '@/api/auth';
import type { UUID } from '@/types/common';
import type { FamilyMember, Relationship } from '@/types/families';

type RelationshipTypeValue = 'parent_child' | 'spouse' | 'sibling';

interface RelationshipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyGroupId: UUID;
  members: FamilyMember[];
  existingRelationships: Relationship[];
  onSuccess: () => void;
}

const relationshipTypes: { value: RelationshipTypeValue; label: string; description: string }[] = [
  { value: 'parent_child', label: 'Родитель-Ребёнок', description: 'Установить родственную связь' },
  { value: 'spouse', label: 'Супруг(а)', description: 'Установить брачную связь' },
  { value: 'sibling', label: 'Брат/Сестра', description: 'Установить связь брата/сестры' },
];

export const RelationshipModal: React.FC<RelationshipModalProps> = ({
  open,
  onOpenChange,
  familyGroupId,
  members,
  existingRelationships,
  onSuccess,
}) => {
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
          <DialogTitle className="text-white">Добавить связь</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Тип связи</Label>
            <Select value={relType} onValueChange={(v) => setRelType(v as RelationshipTypeValue)}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {relationshipTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-slate-300">
                    <div>
                      <div>{type.label}</div>
                      <div className="text-xs text-slate-500">{type.description}</div>
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
                        {deletingId === rel.id ? '...' : '✕'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-slate-800 border-slate-700">
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-gradient-to-r from-emerald-400 to-cyan-400">
            {isSubmitting ? 'Сохранение...' : 'Добавить связь'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};