import {useEffect, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {Loader2, PlusIcon, XIcon} from 'lucide-react';
import {axiosInstance} from '@/api/auth';
import {toast} from 'sonner';
import type {UUID} from '@/types/common';
import type {TagRead} from '@/types/profile_posts';
import type {AxiosError} from 'axios';

interface TagSelectorProps {
  familyGroupId: UUID;
  postId?: UUID;
  initialTags?: TagRead[];
  onTagsChange?: (tagIds: Set<UUID>) => void;
  isEditable?: boolean;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  familyGroupId,
  postId,
  initialTags = [],
  onTagsChange,
  isEditable = true,
}) => {
  const queryClient = useQueryClient();
  const [newTagName, setNewTagName] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<Set<UUID>>(
    new Set(initialTags.map(t => t.id))
  );

  useEffect(() => {
    if (onTagsChange) {
      onTagsChange(selectedTagIds);
    }
  }, [selectedTagIds, onTagsChange]);

  const { data: availableTags, isLoading: isLoadingTags, refetch: refetchTags } = useQuery({
    queryKey: ['family-tags', familyGroupId],
    queryFn: async () => {
      if (!familyGroupId) return [];
      const response = await axiosInstance.get<TagRead[]>(
        `/tags/families/${familyGroupId}/tags?family_id=${familyGroupId}`
      );
      return response.data;
    },
    enabled: !!familyGroupId,
  });

  const createTagMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!familyGroupId) throw new Error('Family group ID is required');
      const response = await axiosInstance.post<TagRead>(
        `/tags/families/${familyGroupId}/tags?family_id=${familyGroupId}`,
        { name: name }
      );
      return response.data;
    },
    onSuccess: (newTag) => {
      void refetchTags();
      setNewTagName('');
      toast.success(`Тег "${newTag.name}" создан`);
      const newSelected = new Set(selectedTagIds);
      newSelected.add(newTag.id);
      setSelectedTagIds(newSelected);
    },
    onError: (err: AxiosError) => {
      console.error('Create tag error:', err.response?.data);
      toast.error('Ошибка при создании тега');
    },
  });

  const updatePostTagsMutation = useMutation({
    mutationFn: async (tagIds: UUID[]) => {
      if (!postId || !familyGroupId) throw new Error('Post ID or Family ID is required');
      return axiosInstance.post(
        `/tags/families/${familyGroupId}/posts/${postId}/tags?family_id=${familyGroupId}`,
        tagIds
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['post', postId] });
      void queryClient.invalidateQueries({ queryKey: ['family-feed'] });
    },
    onError: (err: AxiosError) => {
      console.error('Update tags error:', err);
      toast.error('Ошибка при обновлении тегов');
    },
  });

  const handleToggleTag = (tagId: UUID) => {
    const newSelected = new Set(selectedTagIds);
    if (newSelected.has(tagId)) {
      newSelected.delete(tagId);
    } else {
      newSelected.add(tagId);
    }
    setSelectedTagIds(newSelected);

    if (postId && familyGroupId) {
      updatePostTagsMutation.mutate(Array.from(newSelected));
    }
  };

  const handleCreateTag = async () => {
    if (newTagName.trim() && newTagName.length <= 50) {
      if (!familyGroupId) {
        toast.error('Сначала выберите семейную группу');
        return;
      }
      await createTagMutation.mutateAsync(newTagName.trim());
    } else {
      toast.error('Название тега должно быть от 1 до 50 символов');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateTag();
    }
  };

  if (!familyGroupId) {
    return (
      <p className="text-sm text-slate-500">
        Выберите семейную группу, чтобы использовать теги
      </p>
    );
  }

  if (!isEditable) {
    return (
      <div className="flex flex-wrap gap-1">
        {initialTags.map((tag) => (
          <Badge key={tag.id} variant="secondary" className="text-xs">
            #{tag.name}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {isLoadingTags ? (
        <div className="flex justify-center py-2">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {availableTags && availableTags.length > 0 ? (
            availableTags.map((tag) => (
              <Badge
                key={tag.id}
                variant={selectedTagIds.has(tag.id) ? "default" : "outline"}
                className={`cursor-pointer transition-all ${
                  selectedTagIds.has(tag.id)
                    ? 'bg-[var(--primary)] hover:bg-[var(--primary)]/80 text-white'
                    : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
                }`}
                onClick={() => handleToggleTag(tag.id)}
              >
                #{tag.name}
                {selectedTagIds.has(tag.id) && (
                  <XIcon className="w-3 h-3 ml-1" />
                )}
              </Badge>
            ))
          ) : (
            <p className="text-xs text-slate-500">Нет тегов. Создайте первый!</p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Новый тег..."
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          onKeyPress={handleKeyPress}
          maxLength={50}
          className="flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm"
          disabled={createTagMutation.isPending}
        />
        <Button
          type="button"
          size="sm"
          onClick={handleCreateTag}
          disabled={!newTagName.trim() || createTagMutation.isPending}
          className="bg-slate-700 hover:bg-slate-600"
        >
          {createTagMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <PlusIcon className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
};