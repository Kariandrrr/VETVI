import {useState} from 'react';
import {useCreatePost, useFamilyFeed} from '@/hooks/usePosts';
import {useAllFamilyMembers, useMyProfile} from '@/hooks/useMemberProfile';
import {Button} from '@/components/ui/button';
import {PostCard} from '@/components/PostCard';
import {PostForm} from '@/components/PostForm';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Skeleton} from '@/components/ui/skeleton';
import {Loader2, PlusIcon} from 'lucide-react';
import type {UUID} from '@/types/common';
import { getDisplayName } from '@/utils/nameFormatter';

interface PostFormFields {
  title: string;
  body: string;
  post_type: 'text' | 'photo' | 'audio' | 'video' | 'document';
  attributed_to_member_id: string;
}

interface FamilyFeedProps {
  familyGroupId: UUID;
}

export const FamilyFeed: React.FC<FamilyFeedProps> = ({ familyGroupId }) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { data: myProfile } = useMyProfile(familyGroupId);
  const { data: familyMembers } = useAllFamilyMembers(familyGroupId);
  const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage } = useFamilyFeed(familyGroupId);
  const createPostMutation = useCreatePost(() => setIsCreateDialogOpen(false));

  const allPosts = data?.pages.flatMap((page) => page.posts) || [];

  const handleCreatePost = async (data: PostFormFields) => {
    const postData = {
      ...data,
      attributed_to_member_id: data.attributed_to_member_id || null,
    };
    await createPostMutation.mutateAsync(postData);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card p-6">
            <div className="flex gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-20 w-full mt-4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Post Button */}
      <div className="glass-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
              <span className="text-white font-bold">
                {getDisplayName({
                  firstName: myProfile?.first_name || '',
                  lastName: myProfile?.last_name || '',
                  patronymic: myProfile?.patronymic,
                  displayName: myProfile?.display_name,
                }).charAt(0).toUpperCase() || '?'}
              </span>
            </div>
          <button
            className="flex-1 text-left px-4 py-2 rounded-xl bg-black/20 border border-[var(--glass-border)] text-slate-400 hover:text-white hover:border-[var(--primary)]/50 transition-all"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            Что нового в семье?
          </button>
        </div>
        <Button
          size="sm"
          className="bg-gradient-to-r from-emerald-400 to-cyan-400"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <PlusIcon className="w-4 h-4 mr-1" />
          Создать
        </Button>
      </div>

      {/* Posts List */}
      {allPosts.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-slate-400 mb-4">В семье пока нет публикаций</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            Создать первую публикацию
          </Button>
        </div>
      ) : (
        <>
          {allPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              familyGroupId={familyGroupId}
            />
          ))}

          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  'Загрузить ещё'
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create Post Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-emerald-600 dark:text-emerald-400">
              Новая публикация
            </DialogTitle>
          </DialogHeader>

          <PostForm
            familyMembers={familyMembers?.map((m) => ({
              id: m.id,
              display_name: m.display_name,
              first_name: m.first_name,
              last_name: m.last_name,
            }))}
            onSubmit={handleCreatePost}
            isSubmitting={createPostMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};