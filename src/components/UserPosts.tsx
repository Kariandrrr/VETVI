import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Skeleton} from '@/components/ui/skeleton';
import {PostCard} from '@/components/PostCard';
import {HeartIcon, PlusIcon} from 'lucide-react';
import {CreatePostWithMedia} from './CreatePostWithMedia';
import type {PostRead} from '@/types/profile_posts';
import type {UUID} from '@/types/common';

interface UserPostsProps {
    posts: PostRead[];
    isLoading: boolean;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    familyGroupId: string;
    onCreatePost: () => void;
    onLoadMore: () => void;
    onPostDelete: () => void;
    currentMemberId?: UUID;
}

export const UserPosts: React.FC<UserPostsProps> = ({
    posts,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    familyGroupId,
    onCreatePost,
    onLoadMore,
    onPostDelete,
    currentMemberId,
}) => {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="glass-card p-4">
                        <Skeleton className="h-6 w-48 mb-4" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <Button
                className="w-full mb-4 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-500 hover:to-cyan-500"
                onClick={() => setIsCreateDialogOpen(true)}
            >
                <PlusIcon className="w-4 h-4 mr-2" />
                Создать публикацию
            </Button>

            {posts.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                    <HeartIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>У вас пока нет публикаций</p>
                    <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setIsCreateDialogOpen(true)}
                    >
                        Создать первую публикацию
                    </Button>
                </div>
            ) : (
                <>
                    {posts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            familyGroupId={familyGroupId}
                            onDelete={onPostDelete}
                            onUpdate={onPostDelete}
                        />
                    ))}
                    {hasNextPage && (
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={onLoadMore}
                            disabled={isFetchingNextPage}
                        >
                            {isFetchingNextPage ? 'Загрузка...' : 'Загрузить ещё'}
                        </Button>
                    )}
                </>
            )}

            <CreatePostWithMedia
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onPostCreated={onCreatePost}
                currentMemberId={currentMemberId}
                  familyGroupId={familyGroupId}
            />
        </div>
    );
};