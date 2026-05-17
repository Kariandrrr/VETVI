import {Button} from '@/components/ui/button';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Badge} from '@/components/ui/badge';
import {CalendarIcon, MailIcon, MapPinIcon, PencilIcon} from 'lucide-react';
import {format} from 'date-fns';
import {ru} from 'date-fns/locale';
import type {UserRead} from '@/types/auth';
import type {MemberProfileRead} from '@/types/profile_posts';

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
    onEditMember,
}) => {
    const fullName = [myProfile?.last_name, myProfile?.first_name, myProfile?.patronymic].filter(Boolean).join(' ');
    const initials = user?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';

    return (
        <div className="glass-card p-8 relative group">
            {/* Фоновые неоновые акценты */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-[var(--primary)] rounded-full blur-[90px] opacity-20 pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-[var(--secondary)] rounded-full blur-[90px] opacity-15 pointer-events-none" />

            <div className="absolute top-4 right-4 flex gap-2 z-10">
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-slate-400 hover:text-white hover:bg-[var(--glass-bg)]"
                    onClick={onEditMember}
                >
                    <PencilIcon className="w-4 h-4" />
                    Редактировать профиль
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-slate-400 hover:text-white hover:bg-[var(--glass-bg)]"
                    onClick={onEditAccount}
                >
                    <PencilIcon className="w-4 h-4" />
                    Редактировать аккаунт
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-8 relative z-10">
                <Avatar className="w-32 h-32 border-4 border-[var(--primary)]/30 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                    <AvatarImage src={user?.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-3xl text-white">
                        {initials}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-3">
                    <div>
                        <h2 className="text-3xl font-bold text-white">
                            {user?.display_name || fullName || user?.email?.split('@')[0] || 'Пользователь'}
                        </h2>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {myProfile && (
                                <Badge variant="outline" className="border-emerald-500 text-emerald-400">
                                    Член семьи
                                </Badge>
                            )}
                        </div>
                    </div>

                    {fullName && fullName !== user?.display_name && (
                        <p className="text-slate-400">
                            <span className="text-slate-500">Полное имя:</span> {fullName}
                        </p>
                    )}

                    {myProfile?.bio && (
                        <p className="text-slate-300 leading-relaxed">{myProfile.bio}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                        <div className="flex items-center gap-1">
                            <MailIcon className="w-4 h-4" />
                            {user?.email}
                        </div>
                        {myProfile?.date_of_birth && (
                            <div className="flex items-center gap-1">
                                <CalendarIcon className="w-4 h-4" />
                                {format(new Date(myProfile.date_of_birth), 'd MMMM yyyy', { locale: ru })}
                            </div>
                        )}
                        {myProfile?.birth_place && (
                            <div className="flex items-center gap-1">
                                <MapPinIcon className="w-4 h-4" />
                                {myProfile.birth_place}
                            </div>
                        )}
                        {user?.created_at && (
                            <div className="flex items-center gap-1">
                                <CalendarIcon className="w-4 h-4" />
                                На сайте с {format(new Date(user.created_at), 'MMMM yyyy', { locale: ru })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};