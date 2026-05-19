import {useState} from 'react';
import {useFamilyFeed} from '@/hooks/usePosts';
import {useMyProfile} from '@/hooks/useMemberProfile';
import {Button} from '@/components/ui/button';
import {PostCard} from '@/components/PostCard';
import {CreatePostWithMedia} from '@/components/CreatePostWithMedia';
import {Skeleton} from '@/components/ui/skeleton';
import {Loader2, PlusIcon} from 'lucide-react';
import type {UUID} from '@/types/common';
import {getDisplayName} from '@/utils/nameFormatter';

interface FamilyFeedProps {
  familyGroupId: UUID;
}

export const FamilyFeed: React.FC<FamilyFeedProps> = ({ familyGroupId }) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { data: myProfile } = useMyProfile(familyGroupId);
  const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage, refetch } = useFamilyFeed(familyGroupId);

  const allPosts = data?.pages.flatMap((page) => page.posts) || [];

  const handlePostCreated = () => {
    void refetch();
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
          <text
            className="flex-1 text-left px-4 py-2 rounded-xl bg-black/20 border border-[var(--glass-border)] text-slate-400 hover:text-white hover:border-[var(--primary)]/50 transition-all"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            Что нового в семье?
          </text>
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
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-gradient-to-r from-emerald-400 to-cyan-400"
          >
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
              onUpdate={handlePostCreated}
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
      <CreatePostWithMedia
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onPostCreated={handlePostCreated}
        currentMemberId={myProfile?.id}
        familyGroupId={familyGroupId}
      />
    </div>
  );
};