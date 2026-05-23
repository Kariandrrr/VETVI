import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { CalendarIcon, MailIcon, UserIcon } from 'lucide-react';
import type { UserRead } from '@/types/auth';
import type { MemberProfileRead } from '@/types/profile_posts';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getFullImageUrl = (url: string | null | undefined): string | undefined => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;

    let cleanUrl = url;
    while (cleanUrl.startsWith('/')) {
        cleanUrl = cleanUrl.substring(1);
    }

    const cleanBaseUrl = API_BASE_URL.replace(/\/$/, '');

    return `${cleanBaseUrl}/${cleanUrl}`;
};

interface UserProfileCardProps {
    user: UserRead | null;
    myProfile: MemberProfileRead | null;
    onEditAccount: () => void;
    onEditMember: () => void;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
    user,
    myProfile,
    onEditAccount,
}) => {
    const fullName = [myProfile?.last_name, myProfile?.first_name, myProfile?.patronymic]
        .filter(Boolean)
        .join(' ');

    const initials = `${myProfile?.first_name?.[0] || ''}${myProfile?.last_name?.[0] || ''}`.toUpperCase();

    const avatarUrl = getFullImageUrl(myProfile?.avatar_url) || getFullImageUrl(user?.avatar_url);

    console.log('UserProfileCard - avatarUrl:', avatarUrl);
    console.log('UserProfileCard - myProfile.avatar_url:', myProfile?.avatar_url);

    return (
        <div className="glass-card p-8 relative group">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    <Avatar className="w-32 h-32 border-4 border-[var(--primary)]/30 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                        <AvatarImage
                            src={avatarUrl}
                            onError={(e) => {
                                console.error('Avatar failed to load:', avatarUrl);
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-3xl text-white">
                            {initials || <UserIcon className="w-12 h-12" />}
                        </AvatarFallback>
                    </Avatar>
                </div>

                {/* User Info */}
                <div className="flex-1 space-y-3">
                    <div>
                        <h2 className="text-3xl font-bold text-white">
                            {fullName || user?.display_name || 'Пользователь'}
                        </h2>
                        <div className="flex items-center gap-2 mt-1 text-slate-400">
                            <MailIcon className="w-4 h-4" />
                            <span>{user?.email}</span>
                        </div>
                    </div>

                    {myProfile?.bio && (
                        <p className="text-slate-300 leading-relaxed">{myProfile.bio}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                        {myProfile?.date_of_birth && (
                            <span className="flex items-center gap-1">
                                <CalendarIcon className="w-4 h-4" />
                                {format(new Date(myProfile.date_of_birth), 'd MMMM yyyy', { locale: ru })}
                            </span>
                        )}
                        {myProfile?.birth_place && (
                            <span className="flex items-center gap-1">
                                📍 {myProfile.birth_place}
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            👥 В семье с {myProfile?.joined_at ? format(new Date(myProfile.joined_at), 'MMMM yyyy', { locale: ru }) : 'недавно'}
                        </span>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            onClick={onEditAccount}
                            variant="outline"
                            className="border-[var(--glass-border)] hover:bg-[var(--glass-bg)]"
                        >
                            Редактировать аккаунт
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};