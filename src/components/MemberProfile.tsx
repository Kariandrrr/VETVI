import {useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {useMemberProfile, useMyProfile, useUpdateMemberProfile} from '@/hooks/useMemberProfile';
import {useUserPosts} from '@/hooks/usePosts';
import {Button} from '@/components/ui/button';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Badge} from '@/components/ui/badge';
import {Skeleton} from '@/components/ui/skeleton';
import {PostCard} from '@/components/PostCard';
import type {ProfileUpdateFormData} from '@/components/EditMemberProfileForm';
import {EditMemberProfileForm} from '@/components/EditMemberProfileForm';
import {ArrowLeftIcon, CalendarIcon, HeartIcon, MapPinIcon, PencilIcon, UserIcon, UsersIcon} from 'lucide-react';
import {format} from 'date-fns';
import {ru} from 'date-fns/locale';
import {toast} from 'sonner';
import type {UUID} from '@/types/common';

interface MemberProfileProps {
    familyGroupId: UUID;
    memberId?: UUID;
}

export const MemberProfile: React.FC<MemberProfileProps> = ({ familyGroupId, memberId: propMemberId }) => {
    const { memberId: paramMemberId } = useParams<{ memberId: string }>();
    const navigate = useNavigate();
    const memberId = (propMemberId || paramMemberId) as UUID;

    const { data: myProfile, isLoading: isLoadingMyProfile } = useMyProfile(familyGroupId);
    const { data: profile, isLoading: isLoadingProfile, refetch } = useMemberProfile(familyGroupId, memberId);
    const { data: userPostsData, fetchNextPage, hasNextPage, isLoading: isLoadingPosts } = useUserPosts(
        profile?.user_id || '' as UUID,
        { enabled: !!profile?.user_id && profile?.is_alive !== false }
    );

    const updateProfileMutation = useUpdateMemberProfile(familyGroupId, memberId);
    const [isEditing, setIsEditing] = useState(false);

    const isOwner = myProfile?.id === memberId;
    const isFamilyAdmin = myProfile?.role === 'admin';
    const hasAccount = profile?.user_id !== null && profile?.user_id !== undefined;
    const isDeceased = profile?.is_alive === false;
    const canEdit = isOwner || (isFamilyAdmin && (isDeceased || !hasAccount));

    const allPosts = userPostsData?.pages.flatMap((page) => page.posts) || [];

    const onSubmit = async (data: ProfileUpdateFormData) => {
    const updateData: Record<string, unknown> = {};

        updateData.family_id = familyGroupId;

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

    console.log('📤 Sending update data:', updateData);

    try {
        await updateProfileMutation.mutateAsync(updateData);
        toast.success('Профиль обновлён');
        setIsEditing(false);
        refetch();
    } catch (error: unknown) {
        console.error('❌ Update error:', error);

        type AxiosErrorType = {
            response?: {
                status?: number;
                data?: {
                    detail?: string | Array<{
                        type: string;
                        loc: string[];
                        msg: string;
                        input?: unknown;
                    }>;
                };
            };
            request?: unknown;
            message?: string;
        };

        const axiosError = error as AxiosErrorType;

        if (axiosError.response) {
            console.error('Response status:', axiosError.response.status);
            console.error('Response data:', axiosError.response.data);

            const detail = axiosError.response.data?.detail;

            if (detail) {
                if (Array.isArray(detail)) {
                    detail.forEach((err) => {
                        const field = err.loc?.slice(1).join('.') || 'unknown';
                        const message = err.msg;
                        console.error(`❌ Validation error - ${field}: ${message}`);
                        toast.error(`${field}: ${message}`);
                    });
                } else if (typeof detail === 'string') {
                    console.error(`❌ Error: ${detail}`);
                    toast.error(detail);
                } else {
                    toast.error('Ошибка валидации данных');
                }
            } else {
                toast.error(`Ошибка ${axiosError.response.status}`);
            }
        } else if (axiosError.request) {
            console.error('No response received:', axiosError.request);
            toast.error('Сервер не отвечает');
        } else {
            console.error('Error setting up request:', axiosError.message);
            toast.error(`Ошибка: ${axiosError.message}`);
        }
    }
};

    if (isLoadingProfile || isLoadingMyProfile) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]" />
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

    const fullName = [profile.last_name, profile.first_name, profile.patronymic].filter(Boolean).join(' ');
    const initials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase();
    const showPostsTab = profile.is_alive !== false && profile.user_id !== null;

    return (
        <div className="space-y-6">
            <div className="glass-card p-8 relative group">
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-[var(--primary)] rounded-full blur-[90px] opacity-20 pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-[var(--secondary)] rounded-full blur-[90px] opacity-15 pointer-events-none" />

                {canEdit && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-4 right-4 gap-2 text-slate-400 hover:text-white hover:bg-[var(--glass-bg)] z-10"
                        onClick={() => setIsEditing(true)}
                    >
                        <PencilIcon className="w-4 h-4" />
                        Редактировать
                    </Button>
                )}

                <div className="flex flex-col md:flex-row gap-8 relative z-10">
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
                                    {profile.role === 'admin' ? 'Админ' : profile.role === 'editor' ? 'Редактор' : 'Зритель'}
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
                                {!hasAccount && (
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

            <Tabs defaultValue={showPostsTab ? "posts" : "about"} className="glass-card overflow-hidden">
                <TabsList className="w-full bg-transparent border-b border-[var(--glass-border)] p-0 h-auto">
                    {showPostsTab && (
                        <TabsTrigger
                            value="posts"
                            className="data-[state=active]:border-b-2 data-[state=active]:border-[var(--primary)] rounded-none py-3 px-6 text-slate-400 data-[state=active]:text-white"
                        >
                            Публикации
                        </TabsTrigger>
                    )}
                    <TabsTrigger
                        value="about"
                        className="data-[state=active]:border-b-2 data-[state=active]:border-[var(--primary)] rounded-none py-3 px-6 text-slate-400 data-[state=active]:text-white"
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

                <TabsContent value="about" className="p-6">
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

            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="bg-slate-900 border border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-white">Редактировать профиль</DialogTitle>
                    </DialogHeader>

                    <EditMemberProfileForm
                        initialData={{
                            display_name: profile.display_name || '',
                            bio: profile.bio || '',
                            date_of_birth: profile.date_of_birth || '',  // <-- изменено
                            first_name: profile.first_name || '',
                            last_name: profile.last_name || '',
                            patronymic: profile.patronymic || '',
                            gender: profile.gender || 'unknown',
                            birth_place: profile.birth_place || '',
                            death_date: profile.death_date || '',
                            death_place: profile.death_place || '',
                            is_alive: profile.is_alive !== false,
                        }}
                        onSubmit={onSubmit}
                        isSubmitting={updateProfileMutation.isPending}
                        isAdmin={isFamilyAdmin}
                        isOwner={isOwner}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
};

const InfoItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="space-y-1 p-3 rounded-xl bg-white/5 border border-[var(--glass-border)]">
        <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-slate-200 font-medium break-words">{value}</p>
    </div>
);