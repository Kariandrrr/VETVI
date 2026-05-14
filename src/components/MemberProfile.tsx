import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMemberProfile, useMyProfile, useUpdateMemberProfile } from '@/hooks/useMemberProfile';
import { useUserPosts } from '@/hooks/usePosts';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PostCard } from '@/components/PostCard';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    ArrowLeftIcon,
    CalendarIcon,
    HeartIcon,
    MapPinIcon,
    PencilIcon,
    UserIcon,
    UsersIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { UUID } from '@/types/common';

const profileUpdateSchema = z.object({
    display_name: z.string().optional().nullable(),
    bio: z.string().max(500, 'Не более 500 символов').optional().nullable(),
    date_of_birth: z.string().optional().nullable(),

    first_name: z.string().optional().nullable(),
    last_name: z.string().optional().nullable(),
    patronymic: z.string().optional().nullable(),
    gender: z.enum(['male', 'female', 'other', 'unknown']).optional().nullable(),
    birth_place: z.string().optional().nullable(),
    death_date: z.string().optional().nullable(),
    death_place: z.string().optional().nullable(),
    is_alive: z.boolean().optional(),
    role: z.enum(['admin', 'editor', 'viewer']).optional().nullable(),
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
        profile?.user_id || '' as UUID,
        { enabled: !!profile?.user_id && profile?.is_alive !== false }
    );

    const updateProfileMutation = useUpdateMemberProfile(familyGroupId, memberId);
    const [isEditing, setIsEditing] = useState(false);

    const isOwner = myProfile?.id === memberId;
    const isAdmin = myProfile?.role === 'admin';
    const isRegisteredUser = profile?.user_id !== null && profile?.user_id !== undefined;
    const isDeceased = profile?.is_alive === false;

    const canEdit = isOwner || (isAdmin && (!isRegisteredUser || isDeceased));

    const allPosts = userPostsData?.pages.flatMap((page) => page.posts) || [];

    const form = useForm<ProfileUpdateFormData>({
        resolver: zodResolver(profileUpdateSchema),
        defaultValues: {
            display_name: profile?.display_name || '',
            bio: profile?.bio || '',
            date_of_birth: profile?.date_of_birth || '',
            first_name: profile?.first_name || '',
            last_name: profile?.last_name || '',
            patronymic: profile?.patronymic || '',
            gender: profile?.gender || 'unknown',
            birth_place: profile?.birth_place || '',
            death_date: profile?.death_date || '',
            death_place: profile?.death_place || '',
            is_alive: profile?.is_alive !== false,
            role: profile?.role || 'viewer',
        },
    });

    useEffect(() => {
        if (profile) {
            form.reset({
                display_name: profile.display_name || '',
                bio: profile.bio || '',
                date_of_birth: profile.date_of_birth || '',
                first_name: profile.first_name || '',
                last_name: profile.last_name || '',
                patronymic: profile.patronymic || '',
                gender: profile.gender || 'unknown',
                birth_place: profile.birth_place || '',
                death_date: profile.death_date || '',
                death_place: profile.death_place || '',
                is_alive: profile.is_alive !== false,
                role: profile.role || 'viewer',
            });
        }
    }, [profile, form]);

    const onSubmit = async (data: ProfileUpdateFormData) => {
        const updateData: Record<string, unknown> = {};

        if (data.display_name !== undefined) updateData.display_name = data.display_name;
        if (data.bio !== undefined) updateData.bio = data.bio;
        if (data.date_of_birth !== undefined) updateData.date_of_birth = data.date_of_birth;
        if (data.first_name !== undefined) updateData.first_name = data.first_name;
        if (data.last_name !== undefined) updateData.last_name = data.last_name;
        if (data.patronymic !== undefined) updateData.patronymic = data.patronymic;
        if (data.gender !== undefined) updateData.gender = data.gender;
        if (data.birth_place !== undefined) updateData.birth_place = data.birth_place;
        if (data.death_date !== undefined) updateData.death_date = data.death_date;
        if (data.death_place !== undefined) updateData.death_place = data.death_place;
        if (data.is_alive !== undefined) updateData.is_alive = data.is_alive;
        if (data.role !== undefined) updateData.role = data.role;

        await updateProfileMutation.mutateAsync(updateData);
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

    const showPostsTab = profile.is_alive !== false && profile.user_id !== null;

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <div className="glass-card p-8 relative group">
                {canEdit && (
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
                                {profile.is_alive !== false ? (
                                    <Badge variant="outline" className="border-emerald-500 text-emerald-400">
                                        Жив(а)
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="border-slate-500 text-slate-400">
                                        Умер(ла)
                                    </Badge>
                                )}
                                {!isRegisteredUser && (
                                    <Badge variant="outline" className="border-amber-500 text-amber-400">
                                        Без аккаунта
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
            <Tabs defaultValue={showPostsTab ? "posts" : "about"} className="glass-card overflow-hidden">
                <TabsList className="w-full bg-transparent border-b border-[var(--glass-border)] p-0 h-auto">
                    {showPostsTab && (
                        <TabsTrigger
                            value="posts"
                            className="data-[state=active]:border-b-2 data-[state=active]:border-[var(--primary)] rounded-none py-3 px-6"
                        >
                            Публикации
                        </TabsTrigger>
                    )}
                    <TabsTrigger
                        value="about"
                        className="data-[state=active]:border-b-2 data-[state=active]:border-[var(--primary)] rounded-none py-3 px-6"
                    >
                        О себе
                    </TabsTrigger>
                </TabsList>

                {showPostsTab && (
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
                )}

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
                        <InfoItem
                            label="Статус"
                            value={profile.is_alive !== false ? 'Жив(а)' : 'Умер(ла)'}
                        />
                        {!isRegisteredUser && (
                            <InfoItem label="Тип" value="Добавлен вручную (без аккаунта)" />
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Edit Profile Dialog */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="bg-white dark:bg-slate-900 border border-[var(--glass-border)] max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Редактировать профиль</DialogTitle>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {/* Основные поля */}
                            <FormField
                                control={form.control}
                                name="display_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Отображаемое имя</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Как называть в семье"
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

                            {/* Поля ФИО */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="last_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Фамилия</FormLabel>
                                            <FormControl>
                                                <Input {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="first_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Имя</FormLabel>
                                            <FormControl>
                                                <Input {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="patronymic"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Отчество</FormLabel>
                                            <FormControl>
                                                <Input {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Пол и роль (только для админа) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="gender"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Пол</FormLabel>
                                            <Select
                                                value={field.value || 'unknown'}
                                                onValueChange={field.onChange}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="male">Мужской</SelectItem>
                                                    <SelectItem value="female">Женский</SelectItem>
                                                    <SelectItem value="other">Другой</SelectItem>
                                                    <SelectItem value="unknown">Не указан</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {isAdmin && !isOwner && (
                                    <FormField
                                        control={form.control}
                                        name="role"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Роль в семье</FormLabel>
                                                <Select
                                                    value={field.value || 'viewer'}
                                                    onValueChange={field.onChange}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="admin">Администратор</SelectItem>
                                                        <SelectItem value="editor">Редактор</SelectItem>
                                                        <SelectItem value="viewer">Зритель</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>

                            {/* Место рождения */}
                            <FormField
                                control={form.control}
                                name="birth_place"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Место рождения</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Даты */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="date_of_birth"
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

                                <FormField
                                    control={form.control}
                                    name="death_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Дата смерти (если применимо)</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Место смерти */}
                            <FormField
                                control={form.control}
                                name="death_place"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Место смерти</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Статус жив/мёртв */}
                            <FormField
                                control={form.control}
                                name="is_alive"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                        <div className="space-y-0.5">
                                            <FormLabel>Статус</FormLabel>
                                            <p className="text-xs text-slate-500">Отметьте, если человек жив</p>
                                        </div>
                                        <FormControl>
                                            <input
                                                type="checkbox"
                                                className="h-5 w-5 rounded border-slate-600"
                                                checked={field.value === true}
                                                onChange={(e) => field.onChange(e.target.checked)}
                                            />
                                        </FormControl>
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