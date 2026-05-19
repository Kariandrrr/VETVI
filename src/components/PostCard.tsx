import {useEffect, useRef, useState} from 'react';
import {useDeleteMedia, useDeletePost, useMyReaction, useToggleReaction, useUpdatePost} from '@/hooks/usePosts';
import {useMyProfile} from '@/hooks/useMemberProfile';
import {Button} from '@/components/ui/button';
import {Avatar, AvatarFallback} from '@/components/ui/avatar';
import {Badge} from '@/components/ui/badge';
import {
    AngryIcon,
    EyeIcon,
    FrownIcon,
    HeartIcon,
    ImageIcon,
    LaughIcon,
    PartyPopperIcon,
    PencilIcon,
    ThumbsUpIcon,
    Trash2Icon,
    XIcon,
} from 'lucide-react';
import {formatDistanceToNow} from 'date-fns';
import {ru} from 'date-fns/locale';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {PostForm} from './PostForm';
import {TagSelector} from './TagSelector';
import {toast} from 'sonner';
import type {PostRead, PostUpdate, ReactionType} from '@/types/profile_posts';
import type {UUID} from '@/types/common';

interface PostCardProps {
  post: PostRead;
  familyGroupId: string;
  onDelete?: () => void;
  isCompact?: boolean;
  onUpdate?: () => void;
}

const reactionIcons: Record<ReactionType, React.ReactNode> = {
  like: <ThumbsUpIcon className="w-4 h-4" />,
  love: <HeartIcon className="w-4 h-4 text-red-500" />,
  haha: <LaughIcon className="w-4 h-4 text-yellow-500" />,
  wow: <EyeIcon className="w-4 h-4 text-purple-500" />,
  sad: <FrownIcon className="w-4 h-4 text-blue-400" />,
  angry: <AngryIcon className="w-4 h-4 text-red-600" />,
  laugh: <PartyPopperIcon className="w-4 h-4 text-emerald-500" />,
};

const reactionNames: Record<ReactionType, string> = {
  like: 'Нравится',
  love: 'Любовь',
  haha: 'Ха-ха',
  wow: 'Ух ты!',
  sad: 'Печально',
  angry: 'Возмутительно',
  laugh: 'Весело',
};

export const PostCard: React.FC<PostCardProps> = ({
  post,
  familyGroupId,
  onDelete,
  isCompact = false,
  onUpdate,
}) => {
  const [selectedMedia, setSelectedMedia] = useState<number | null>(null);
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: myProfile } = useMyProfile(familyGroupId);
  const { data: myReaction } = useMyReaction(familyGroupId, post.id);
  const toggleReactionMutation = useToggleReaction(familyGroupId, post.id);
  const deletePostMutation = useDeletePost();
  const updatePostMutation = useUpdatePost(post.id);
  const deleteMediaMutation = useDeleteMedia();

  const isOwner = myProfile?.id === post.attributed_to_member_id || myProfile?.user_id === post.author_id;
  const currentReaction = myReaction?.reaction_type;

  const canReact = !isOwner;

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (!canReact) return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setShowReactions(true);
  };

  const handleMouseLeave = () => {
    if (!canReact) return;
    hoverTimeoutRef.current = setTimeout(() => {
      setShowReactions(false);
    }, 300);
  };

  const handleReaction = (type: ReactionType) => {
    if (!canReact) return;
    toggleReactionMutation.mutate(type);
    setShowReactions(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handleDelete = async () => {
    if (confirm('Удалить этот пост?')) {
      await deletePostMutation.mutateAsync(post.id);
      onDelete?.();
    }
  };

  const handleEditSubmit = async (data: PostUpdate) => {
    try {
      await updatePostMutation.mutateAsync(data);
      setIsEditing(false);
      onUpdate?.();
      toast.success('Пост обновлён');
    } catch {
      toast.error('Ошибка при обновлении поста');
    }
  };

  const handleDeleteMedia = async (mediaId: UUID) => {
    if (confirm('Удалить этот файл?')) {
      try {
        await deleteMediaMutation.mutateAsync(mediaId);
        onUpdate?.();
        toast.success('Файл удалён');
      } catch {
        toast.error('Ошибка при удалении файла');
      }
    }
  };

  const totalReactions = post.reactions.reduce((sum, r) => sum + r.count, 0);
  const reactionButtons: ReactionType[] = ['like', 'love', 'haha', 'wow', 'sad', 'angry', 'laugh'];

  return (
    <>
      <div className="glass-card p-6 hover:border-[var(--primary)]/30 transition-all duration-300">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white">
                {post.author?.display_name?.[0]?.toUpperCase() ||
                 post.author?.email?.[0]?.toUpperCase() ||
                 '📝'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-white">
                  {post.author?.display_name ||
                   post.author?.email?.split('@')[0] ||
                   post.title ||
                   'Новая публикация'}
                </h3>
                {post.tags.length > 0 && (
                  <div className="flex gap-1">
                    {post.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag.id} variant="secondary" className="text-xs">
                        #{tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                  locale: ru,
                })}
              </p>
            </div>
          </div>

          {isOwner && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-500 hover:text-amber-400"
                onClick={() => setIsEditing(true)}
              >
                <PencilIcon className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-500 hover:text-red-400"
                onClick={handleDelete}
                disabled={deletePostMutation.isPending}
              >
                <Trash2Icon className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Body */}
        {post.body && (
          <p className="mt-4 text-slate-300 leading-relaxed whitespace-pre-wrap">
            {isCompact ? post.body.slice(0, 150) + (post.body.length > 150 ? '...' : '') : post.body}
          </p>
        )}

        {/* Media Gallery */}
        {post.media.length > 0 && (
          <div className={`mt-4 grid gap-2 ${post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {post.media.slice(0, 4).map((media, idx) => (
              <div
                key={media.id}
                className="relative group aspect-video bg-black/30 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setSelectedMedia(idx)}
              >
                {media.mime_type.startsWith('image/') ? (
                  <img
                    src={`/media/${media.id}/stream`}
                    alt={media.original_name}
                    className="w-full h-full object-cover"
                  />
                ) : media.mime_type.startsWith('video/') ? (
                  <video className="w-full h-full object-cover" preload="metadata">
                    <source src={`/media/${media.id}/stream`} />
                  </video>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800">
                    <ImageIcon className="w-8 h-8 text-slate-500" />
                  </div>
                )}
                {isOwner && (
                  <button
                    className="absolute top-2 right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMedia(media.id);
                    }}
                  >
                    <XIcon className="w-3 h-3 text-white" />
                  </button>
                )}
                {idx === 3 && post.media.length > 4 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">+{post.media.length - 4}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 pt-4 border-t border-[var(--glass-border)] flex items-center gap-4">
          {/* Reactions button - отключаем для своих постов */}
          <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 ${!canReact ? 'opacity-50 cursor-not-allowed' : ''} ${
                currentReaction ? 'text-[var(--primary)]' : 'text-slate-400 hover:text-white'
              }`}
              disabled={!canReact}
            >
              {currentReaction ? reactionIcons[currentReaction] : <ThumbsUpIcon className="w-4 h-4" />}
              <span>{totalReactions > 0 ? totalReactions : 'Нравится'}</span>
            </Button>

            {/* Reactions popup - показываем только если можно реагировать */}
            {showReactions && canReact && (
              <div
                className="absolute bottom-full left-0 mb-2 p-2 bg-slate-800 rounded-xl shadow-xl border border-[var(--glass-border)] flex gap-1 z-10"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {reactionButtons.map((type) => (
                  <button
                    key={type}
                    className={`p-2 rounded-lg hover:bg-slate-700 transition-colors transform hover:scale-110 ${
                      currentReaction === type ? 'bg-[var(--primary)]/20' : ''
                    }`}
                    onClick={() => handleReaction(type)}
                    title={reactionNames[type]}
                  >
                    {reactionIcons[type]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reactions summary */}
        {totalReactions > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
            {post.reactions.map((reaction) => (
              <span key={reaction.reaction_type} className="flex items-center gap-1">
                {reactionIcons[reaction.reaction_type]}
                <span>{reaction.count}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="bg-slate-900 border border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Редактировать пост</DialogTitle>
          </DialogHeader>
          <PostForm
            initialPost={post}
            onSubmit={handleEditSubmit}
            isSubmitting={updatePostMutation.isPending}
            familyMembers={[]}
          />

            {/* Tags section */}
            <div className="mt-4 pt-4 border-t border-slate-700">
              <h4 className="text-sm font-medium text-white mb-2">Теги</h4>
              <TagSelector
                familyGroupId={familyGroupId as UUID}
                postId={post.id}
                initialTags={post.tags}
                onTagsChange={onUpdate}
                isEditable={isOwner}
              />
            </div>
        </DialogContent>
      </Dialog>

      {/* Media viewer dialog */}
      <Dialog open={selectedMedia !== null} onOpenChange={() => setSelectedMedia(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-black/90 border-none">
          {selectedMedia !== null && post.media[selectedMedia] && (
            <div className="relative w-full h-full flex items-center justify-center">
              {post.media[selectedMedia].mime_type.startsWith('image/') ? (
                <img
                  src={`/media/${post.media[selectedMedia].id}/stream`}
                  alt={post.media[selectedMedia].original_name}
                  className="max-w-full max-h-[85vh] object-contain"
                />
              ) : post.media[selectedMedia].mime_type.startsWith('video/') ? (
                <video
                  src={`/media/${post.media[selectedMedia].id}/stream`}
                  controls
                  autoPlay
                  className="max-w-full max-h-[85vh]"
                />
              ) : null}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 rounded-full"
                onClick={() => setSelectedMedia(null)}
              >
                <XIcon className="w-5 h-5" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};