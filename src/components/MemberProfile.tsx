import {useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {useMemberProfile, useMyProfile, useUpdateMemberProfile} from '@/hooks/useMemberProfile';
import {useUserPosts} from '@/hooks/usePosts';
import {Button} from '@/components/ui/button';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Badge} from '@/components/ui/badge';
import {Skeleton} from '@/components/ui/skeleton';
import {PostCard} from '@/components/PostCard';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import * as z from 'zod';
import {ArrowLeftIcon, CalendarIcon, HeartIcon, MapPinIcon, PencilIcon, UserIcon, UsersIcon,} from 'lucide-react';
import {format} from 'date-fns';
import {ru} from 'date-fns/locale';
import type {UUID} from '@/types/common';

const profileUpdateSchema = z.object({
  display_name: z.string().optional().nullable(),
  bio: z.string().max(500, 'Не более 500 символов').optional().nullable(),
  birth_date: z.string().optional().nullable(),
});

type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;

interface MemberProfileProps {
  familyGroupId: UUID;
  memberId?: UUID;
}

export const MemberProfile: React.FC<MemberProfileProps> = ({ familyGroupId, memberId: propMemberId }) => {
  const { memberId: paramMemberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const memberId = (propMemberId || paramMemberId) as UUID;

  const { data: myProfile, isLoading: isLoadingMyProfile } = useMyProfile(familyGroupId);
  const { data: profile, isLoading: isLoadingProfile } = useMemberProfile(familyGroupId, memberId);
  const { data: userPostsData, fetchNextPage, hasNextPage, isLoading: isLoadingPosts } = useUserPosts(
    profile?.user_id || '' as UUID
  );

  const updateProfileMutation = useUpdateMemberProfile(familyGroupId, memberId);
  const [isEditing, setIsEditing] = useState(false);

  const isOwner = myProfile?.id === memberId;
  const allPosts = userPostsData?.pages.flatMap((page) => page.posts) || [];

  const form = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      display_name: profile?.display_name || '',
      bio: profile?.bio || '',
      birth_date: profile?.date_of_birth || '',
    },
  });

  const onSubmit = async (data: ProfileUpdateFormData) => {
    await updateProfileMutation.mutateAsync({
      display_name: data.display_name,
      bio: data.bio,
      birth_date: data.birth_date,
    });
    setIsEditing(false);
  };

  if (isLoadingProfile || isLoadingMyProfile) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-8">
          <div className="flex gap-6 flex-col md:flex-row">
            <Skeleton className="w-32 h-32 rounded-full" />
            <div className="space-y-3 flex-1">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="glass-card p-12 text-center">
        <UsersIcon className="w-16 h-16 mx-auto mb-4 text-slate-500" />
        <h3 className="text-xl font-bold mb-2">Профиль не найден</h3>
        <p className="text-slate-400 mb-6">Участник не существует или у вас нет доступа</p>
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Назад
        </Button>
      </div>
    );
  }

  const fullName = [profile.last_name, profile.first_name, profile.patronymic]
    .filter(Boolean)
    .join(' ');

  const initials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase();

  const roleLabels: Record<string, string> = {
    admin: 'Админ',
    editor: 'Редактор',
    viewer: 'Зритель',
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="glass-card p-8 relative group">
        {isOwner && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 gap-2 text-slate-400 hover:text-white"
            onClick={() => setIsEditing(true)}
          >
            <PencilIcon className="w-4 h-4" />
            Редактировать
          </Button>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          <Avatar className="w-32 h-32 border-4 border-[var(--primary)]/30 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-3xl text-white">
              {initials || <UserIcon className="w-12 h-12" />}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3">
            <div>
              <h1 className="text-3xl font-bold text-white">
                {profile.display_name || fullName || 'Новый участник'}
              </h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="border-[var(--primary)] text-[var(--primary)]">
                  {roleLabels[profile.role] || profile.role}
                </Badge>
                {profile.is_alive !== false && (
                  <Badge variant="outline" className="border-emerald-500 text-emerald-400">
                    Жив(а)
                  </Badge>
                )}
              </div>
            </div>

            {profile.bio && (
              <p className="text-slate-300 leading-relaxed">{profile.bio}</p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
              {profile.date_of_birth && (
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  {format(new Date(profile.date_of_birth), 'd MMMM yyyy', { locale: ru })}
                </span>
              )}
              {profile.birth_place && (
                <span className="flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4" />
                  {profile.birth_place}
                </span>
              )}
              <span className="flex items-center gap-1">
                <UsersIcon className="w-4 h-4" />
                В семье с {format(new Date(profile.joined_at), 'MMMM yyyy', { locale: ru })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="posts" className="glass-card overflow-hidden">
        <TabsList className="w-full bg-transparent border-b border-[var(--glass-border)] p-0 h-auto">
          <TabsTrigger
            value="posts"
            className="data-[state=active]:border-b-2 data-[state=active]:border-[var(--primary)] rounded-none py-3 px-6"
          >
            Публикации
          </TabsTrigger>
          <TabsTrigger
            value="about"
            className="data-[state=active]:border-b-2 data-[state=active]:border-[var(--primary)] rounded-none py-3 px-6"
          >
            О себе
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="p-6 space-y-4">
          {isLoadingPosts ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-card p-4">
                <Skeleton className="h-6 w-48 mb-4" />
                <Skeleton className="h-24 w-full" />
              </div>
            ))
          ) : allPosts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <HeartIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>У {profile.display_name || 'участника'} пока нет публикаций</p>
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
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fetchNextPage()}
                >
                  Загрузить ещё
                </Button>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="about" className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem label="Полное имя" value={fullName || '—'} />
            <InfoItem label="Отображаемое имя" value={profile.display_name || '—'} />
            <InfoItem label="Имя" value={profile.first_name || '—'} />
            <InfoItem label="Фамилия" value={profile.last_name || '—'} />
            <InfoItem label="Отчество" value={profile.patronymic || '—'} />
            {profile.maiden_name && <InfoItem label="Девичья фамилия" value={profile.maiden_name} />}
            <InfoItem
              label="Дата рождения"
              value={profile.date_of_birth ? format(new Date(profile.date_of_birth), 'd MMMM yyyy', { locale: ru }) : '—'}
            />
            <InfoItem label="Место рождения" value={profile.birth_place || '—'} />
            <InfoItem
              label="Пол"
              value={
                profile.gender === 'male' ? 'Мужской' :
                profile.gender === 'female' ? 'Женский' :
                profile.gender === 'other' ? 'Другой' : 'Не указан'
              }
            />
            {profile.death_date && (
              <InfoItem
                label="Дата смерти"
                value={format(new Date(profile.death_date), 'd MMMM yyyy', { locale: ru })}
              />
            )}
            {profile.death_place && (
              <InfoItem label="Место смерти" value={profile.death_place} />
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="bg-white dark:bg-slate-900 border border-[var(--glass-border)]">
          <DialogHeader>
            <DialogTitle>Редактировать профиль</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="display_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Отображаемое имя</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Как вас называть в семье"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>О себе</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Расскажите немного о себе..."
                        className="resize-none"
                        rows={4}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birth_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дата рождения</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const InfoItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="space-y-1">
    <p className="text-sm text-slate-500">{label}</p>
    <p className="text-slate-200 font-medium break-words">{value}</p>
  </div>
);