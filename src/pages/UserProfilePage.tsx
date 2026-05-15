import {useCallback, useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '@/hooks/useAuth';
import {useCreatePost, useUserPosts} from '@/hooks/usePosts';
import {useMyProfile} from '@/hooks/useMemberProfile';
import {useFavoriteFamily} from '@/hooks/useFavFamily';
import {useMutation} from '@tanstack/react-query';
import {profileApi} from '@/api/profile_posts';
import {Button} from '@/components/ui/button';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {PostForm, type PostFormData} from '@/components/PostForm';
import {EditAccountForm} from '@/components/EditAccountForm';
import {EditFamilyMemberDataForm} from '@/components/EditFamilyMemberDataForm';
import {UserProfileCard} from '@/components/UserProfileCard';
import {UserSettings} from '@/components/UserSettings';
import {UserPosts} from '@/components/UserPosts';
import {ArrowLeftIcon} from 'lucide-react';
import {toast} from 'sonner';
import {type ApiError, getErrorMessage} from '@/api/apiError';

export const UserProfilePage = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const { favoriteFamily } = useFavoriteFamily();
    const familyId = favoriteFamily?.id;

    const { data: myProfile, isLoading: isLoadingProfile, refetch: refetchProfile } = useMyProfile(familyId || '');
    const { data: userPosts, fetchNextPage, hasNextPage, isLoading: isLoadingPosts, refetch: refetchPosts } = useUserPosts(
        user?.id || ''
    );

    const [isEditingAccount, setIsEditingAccount] = useState(false);
    const [isEditingMember, setIsEditingMember] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const onPostCreated = useCallback(() => {
        setIsCreateDialogOpen(false);
        refetchPosts();
    }, [refetchPosts]);

    const createPostMutation = useCreatePost(onPostCreated);
    const allPosts = userPosts?.pages.flatMap((page) => page.posts) || [];

    const onAccountSubmit = useCallback(async (data: { display_name?: string; avatar_url?: string | null }) => {
        setIsUpdating(true);
        try {
            await updateUser({
                display_name: data.display_name,
                avatar_url: data.avatar_url,
            });
            toast.success('Данные аккаунта обновлены');
            setIsEditingAccount(false);
        } catch (error) {
            toast.error('Ошибка', { description: getErrorMessage(error, 'Не удалось обновить данные аккаунта') });
        } finally {
            setIsUpdating(false);
        }
    }, [updateUser]);

    const updateMyProfileMutation = useMutation({
        mutationFn: (data: {
            first_name?: string;
            last_name?: string;
            patronymic?: string | null;
            gender?: 'male' | 'female' | 'other' | 'unknown';
            birth_place?: string | null;
            date_of_birth?: string | null;
            bio?: string | null;
        }) => profileApi.updateMyProfile(data),
        onSuccess: () => {
            toast.success('Данные профиля обновлены');
            setIsEditingMember(false);
            refetchProfile();
        },
        onError: (error: ApiError) => {
            toast.error('Ошибка', { description: getErrorMessage(error, 'Не удалось обновить данные профиля') });
        },
    });

    const onMemberSubmit = useCallback(async (data: {
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
        await updateMyProfileMutation.mutateAsync(data);
        await refetchProfile();
    } catch (error) {
        console.error('Update error:', error);
    } finally {
        setIsUpdating(false);
    }
}, [updateMyProfileMutation, refetchProfile]);

    const handleCreatePost = useCallback(async (data: PostFormData) => {
        await createPostMutation.mutateAsync({
            title: data.title,
            body: data.body,
            post_type: data.post_type,
            attributed_to_member_id: myProfile?.id || null,
        });
    }, [createPostMutation, myProfile?.id]);

    const handlePostDelete = useCallback(() => {
        refetchPosts();
    }, [refetchPosts]);

    const handleLoadMore = useCallback(async () => {
        await fetchNextPage();
    }, [fetchNextPage]);

    useEffect(() => {
        return () => {
            setIsEditingAccount(false);
            setIsEditingMember(false);
            setIsCreateDialogOpen(false);
        };
    }, []);

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
                <div className="flex items-center gap-4 mb-8">
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

                <UserProfileCard
                    user={user}
                    myProfile={myProfile || null}
                    onEditAccount={() => setIsEditingAccount(true)}
                    onEditMember={() => setIsEditingMember(true)}
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
                            familyGroupId={familyId || ''}
                            onCreatePost={() => setIsCreateDialogOpen(true)}
                            onLoadMore={handleLoadMore}
                            onPostDelete={handlePostDelete}
                        />
                    </TabsContent>

                    <TabsContent value="settings" className="p-6">
                        <UserSettings user={user} myProfile={myProfile || null} />
                    </TabsContent>
                </Tabs>

                {/* Диалог редактирования аккаунта */}
                <Dialog open={isEditingAccount} onOpenChange={setIsEditingAccount}>
                    <DialogContent className="bg-slate-900 border border-slate-700 max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-white">Редактировать аккаунт</DialogTitle>
                        </DialogHeader>
                        <EditAccountForm
                            initialData={{
                                display_name: user?.display_name || '',
                                avatar_url: user?.avatar_url || '',
                            }}
                            onSubmit={onAccountSubmit}
                            isSubmitting={isUpdating}
                        />
                    </DialogContent>
                </Dialog>

                {/* Диалог редактирования профиля члена семьи */}
                <Dialog open={isEditingMember} onOpenChange={setIsEditingMember}>
                    <DialogContent className="bg-slate-900 border border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-white">Редактировать данные в семейном древе</DialogTitle>
                        </DialogHeader>
                        <EditFamilyMemberDataForm
                            initialData={{
                                first_name: myProfile?.first_name || '',
                                last_name: myProfile?.last_name || '',
                                patronymic: myProfile?.patronymic || '',
                                gender: (myProfile?.gender as 'male' | 'female' | 'other' | 'unknown') || 'unknown',
                                birth_place: myProfile?.birth_place || '',
                                date_of_birth: myProfile?.date_of_birth || '',
                                bio: myProfile?.bio || '',
                            }}
                            onSubmit={onMemberSubmit}
                            isSubmitting={isUpdating}
                        />
                    </DialogContent>
                </Dialog>

                {/* Диалог создания поста */}
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogContent className="bg-slate-900 border border-slate-700 max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-white">Новая публикация</DialogTitle>
                        </DialogHeader>
                        <PostForm
                            familyMembers={[]}
                            onSubmit={handleCreatePost}
                            isSubmitting={createPostMutation.isPending}
                        />
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};