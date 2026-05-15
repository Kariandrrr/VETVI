import type {UserRead} from '@/types/auth';
import type {MemberProfileRead} from '@/types/profile_posts';
import {format} from 'date-fns';
import {ru} from 'date-fns/locale';

interface UserSettingsProps {
    user: UserRead | null;
    myProfile: MemberProfileRead | null;

}

export const UserSettings: React.FC<UserSettingsProps> = ({ user, myProfile }) => {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-white mb-4">Информация об аккаунте</h3>
                <div className="grid gap-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-[var(--glass-border)]">
                        <p className="text-sm text-slate-400">Email</p>
                        <p className="text-white">{user?.email}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-[var(--glass-border)]">
                        <p className="text-sm text-slate-400">Роль</p>
                        <p className="text-white">{user?.role === 'admin' ? 'Администратор' : 'Пользователь'}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-[var(--glass-border)]">
                        <p className="text-sm text-slate-400">ID пользователя</p>
                        <p className="text-white text-sm font-mono break-all">{user?.id}</p>
                    </div>
                </div>
            </div>

            {myProfile && (
                <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Данные в семейном древе</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-white/5 border border-[var(--glass-border)]">
                            <p className="text-sm text-slate-400">Фамилия</p>
                            <p className="text-white">{myProfile.last_name || '—'}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-[var(--glass-border)]">
                            <p className="text-sm text-slate-400">Имя</p>
                            <p className="text-white">{myProfile.first_name || '—'}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-[var(--glass-border)]">
                            <p className="text-sm text-slate-400">Отчество</p>
                            <p className="text-white">{myProfile.patronymic || '—'}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-[var(--glass-border)]">
                            <p className="text-sm text-slate-400">Пол</p>
                            <p className="text-white">
                                {myProfile.gender === 'male' ? 'Мужской' :
                                 myProfile.gender === 'female' ? 'Женский' : 'Не указан'}
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-[var(--glass-border)]">
                            <p className="text-sm text-slate-400">Дата рождения</p>
                            <p className="text-white">
                                {myProfile.date_of_birth ? format(new Date(myProfile.date_of_birth), 'd MMMM yyyy', { locale: ru }) : '—'}
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-[var(--glass-border)]">
                            <p className="text-sm text-slate-400">Место рождения</p>
                            <p className="text-white">{myProfile.birth_place || '—'}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};