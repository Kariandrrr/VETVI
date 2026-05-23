import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '@/hooks/useAuth';
import {useUserPosts} from '@/hooks/usePosts';
import {useMyProfile} from '@/hooks/useMemberProfile';
import {Button} from '@/components/ui/button';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {UserProfileCard} from '@/components/UserProfileCard';
import {UserSettings} from '@/components/UserSettings';
import {UserPosts} from '@/components/UserPosts';
import {FamilySwitcher} from '@/components/FamilySwitcher';
import {CreatePostWithMedia} from '@/components/CreatePostWithMedia';
import {EditMyProfileForm} from '@/components/EditMyProfileForm';
import {ArrowLeftIcon, Users} from 'lucide-react';
import {toast} from 'sonner';
import {AvatarApi, profileApi} from '@/api/profile_posts';
import type {UUID} from '@/types/common';

export const UserProfilePage = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();

    const [selectedFamilyId, setSelectedFamilyId] = useState<UUID | null>(() => {
        const saved = localStorage.getItem('selectedFamilyForProfile');
        return saved ? (saved as UUID) : null;
    });

    useEffect(() => {
        if (selectedFamilyId) {
            localStorage.setItem('selectedFamilyForProfile', selectedFamilyId);
        }
    }, [selectedFamilyId]);

    const { data: myProfile, isLoading: isLoadingProfile, refetch: refetchProfile } = useMyProfile(selectedFamilyId || '');
    const { data: userPosts, fetchNextPage, hasNextPage, isLoading: isLoadingPosts, refetch: refetchPosts } = useUserPosts(
        user?.id || '',
        { enabled: !!user?.id && !!selectedFamilyId }
    );

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const allPosts = userPosts?.pages.flatMap((page) => page.posts) || [];

    const handleUpdateAccount = async (data: { display_name?: string }) => {
        setIsUpdating(true);
        try {
            await updateUser(data);
            toast.success('Данные аккаунта обновлены');
        } catch (error) {
            console.error('Update account error:', error);
            toast.error('Ошибка при обновлении аккаунта');
            throw error;
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdateMember = async (data: {
        first_name?: string;
        last_name?: string;
        patronymic?: string | null;
        gender?: 'male' | 'female' | 'other' | 'unknown';
        birth_place?: string | null;
        date_of_birth?: string | null;
        bio?: string | null;
    }) => {
        setIsUpdating(true);
        try {
            if (selectedFamilyId && myProfile?.id) {
                await profileApi.updateMemberProfile(selectedFamilyId, myProfile.id, data);
                await refetchProfile();
                toast.success('Данные профиля обновлены');
            }
        } catch (error) {
            console.error('Update member error:', error);
            toast.error('Ошибка при обновлении данных профиля');
            throw error;
        } finally {
            setIsUpdating(false);
        }
    };

   const handleAvatarUpload = async (file: File) => {
    if (!selectedFamilyId || !myProfile?.id) {
        toast.error('Сначала выберите семью');
        return;
    }
    setIsUpdating(true);
    try {
        await AvatarApi.uploadAvatar(selectedFamilyId, myProfile.id, file);
        await refetchProfile();
        await updateUser({});
        toast.success('Аватар обновлён');
    } catch (error) {
        console.error('Avatar upload error:', error);
        toast.error('Ошибка при загрузке аватара');
    } finally {
        setIsUpdating(false);
    }
};
    const handleAvatarRemove = async () => {
        if (!selectedFamilyId || !myProfile?.id) return;
        setIsUpdating(true);
        try {
            await AvatarApi.deleteAvatar(selectedFamilyId, myProfile.id);
            await refetchProfile();
            toast.success('Аватар удалён');
        } catch (error) {
            console.error('Remove avatar error:', error);
            toast.error('Ошибка при удалении аватара');
        } finally {
            setIsUpdating(false);
        }
    };

    const onPostCreated = () => {
        void refetchPosts();
    };

    const handlePostDelete = () => {
        void refetchPosts();
    };

    const handleLoadMore = async () => {
        await fetchNextPage();
    };

    const handleSelectFamily = (familyId: UUID) => {
        setSelectedFamilyId(familyId);
    };

    if (isLoadingProfile) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <div className="max-w-[1200px] mx-auto px-6 py-8">
                <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full w-10 h-10 text-slate-400 hover:text-white"
                            onClick={() => navigate('/')}
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-extrabold text-white tracking-tighter">
                                Мой профиль
                            </h1>
                            <p className="text-slate-400 mt-1">
                                Управление аккаунтом и публикациями
                            </p>
                        </div>
                    </div>

                    <FamilySwitcher
                        selectedFamilyId={selectedFamilyId}
                        onSelectFamily={handleSelectFamily}
                        placeholder="Выберите семью для профиля"
                    />
                </div>

                {!selectedFamilyId ? (
                    <div className="glass-card p-12 text-center">
                        <Users className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                        <h3 className="text-xl font-bold text-white mb-2">Выберите семью</h3>
                        <p className="text-slate-400 mb-6">
                            Выберите семейную группу, чтобы просматривать и создавать публикации
                        </p>
                    </div>
                ) : (
                    <>
                        <UserProfileCard
                            user={user}
                            myProfile={myProfile || null}
                            onEditAccount={() => setIsEditingProfile(true)}
                            onEditMember={() => setIsEditingProfile(true)}
                        />

                        <Tabs defaultValue="posts" className="glass-card overflow-hidden mt-6">
                            <TabsList className="w-full bg-transparent border-b border-[var(--glass-border)] p-0 h-auto">
                                <TabsTrigger
                                    value="posts"
                                    className="data-[state=active]:border-b-2 data-[state=active]:border-[var(--primary)] rounded-none py-3 px-6 text-slate-400 data-[state=active]:text-white"
                                >
                                    Мои публикации
                                </TabsTrigger>
                                <TabsTrigger
                                    value="settings"
                                    className="data-[state=active]:border-b-2 data-[state=active]:border-[var(--primary)] rounded-none py-3 px-6 text-slate-400 data-[state=active]:text-white"
                                >
                                    Настройки
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="posts" className="p-6">
                                <UserPosts
                                    posts={allPosts}
                                    isLoading={isLoadingPosts}
                                    hasNextPage={hasNextPage || false}
                                    isFetchingNextPage={false}
                                    familyGroupId={selectedFamilyId}
                                    onCreatePost={() => setIsCreateDialogOpen(true)}
                                    onLoadMore={handleLoadMore}
                                    onPostDelete={handlePostDelete}
                                    currentMemberId={myProfile?.id}
                                />
                            </TabsContent>

                            <TabsContent value="settings" className="p-6">
                                <UserSettings user={user} myProfile={myProfile || null} />
                            </TabsContent>
                        </Tabs>
                    </>
                )}

                {/* Единая форма редактирования */}
                <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
                    <DialogContent className="bg-slate-900 border border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-white">Редактировать профиль</DialogTitle>
                        </DialogHeader>
                        <EditMyProfileForm
                            initialData={{
                                display_name: user?.display_name || '',
                                first_name: myProfile?.first_name || '',
                                last_name: myProfile?.last_name || '',
                                patronymic: myProfile?.patronymic || null,
                                gender: (myProfile?.gender as 'male' | 'female' | 'other' | 'unknown') || 'unknown',
                                birth_place: myProfile?.birth_place || null,
                                date_of_birth: myProfile?.date_of_birth || null,
                                bio: myProfile?.bio || null,
                            }}
                            initialAvatarUrl={myProfile?.avatar_url || user?.avatar_url}
                            onUpdateAccount={handleUpdateAccount}
                            onUpdateMember={handleUpdateMember}
                            onAvatarUpload={handleAvatarUpload}
                            onAvatarRemove={handleAvatarRemove}
                            isSubmitting={isUpdating}
                        />
                    </DialogContent>
                </Dialog>

                <CreatePostWithMedia
                    open={isCreateDialogOpen}
                    onOpenChange={setIsCreateDialogOpen}
                    onPostCreated={onPostCreated}
                    currentMemberId={myProfile?.id}
                    familyGroupId={selectedFamilyId || ''}
                />
            </div>
        </div>
    );
};