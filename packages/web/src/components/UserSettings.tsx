import type {UserRead} from '@/types/auth';
import type {MemberProfileRead} from '@/types/profile_posts';

interface UserSettingsProps {
    user: UserRead  | null;
    myProfile: MemberProfileRead | null;
}

export const UserSettings: React.FC<UserSettingsProps> = ({ user, myProfile }) => {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Данные аккаунта</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-slate-800/50">
                        <p className="text-sm text-slate-400">Email</p>
                        <p className="text-white">{user?.email}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/50">
                        <p className="text-sm text-slate-400">Отображаемое имя</p>
                        <p className="text-white">{user?.display_name || '—'}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Данные в семейном древе</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-slate-800/50">
                        <p className="text-sm text-slate-400">Фамилия</p>
                        <p className="text-white">{myProfile?.last_name || '—'}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/50">
                        <p className="text-sm text-slate-400">Имя</p>
                        <p className="text-white">{myProfile?.first_name || '—'}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/50">
                        <p className="text-sm text-slate-400">Отчество</p>
                        <p className="text-white">{myProfile?.patronymic || '—'}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/50">
                        <p className="text-sm text-slate-400">Пол</p>
                        <p className="text-white">
                            {myProfile?.gender === 'male' ? 'Мужской' :
                             myProfile?.gender === 'female' ? 'Женский' :
                             myProfile?.gender === 'other' ? 'Другой' : 'Не указан'}
                        </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/50">
                        <p className="text-sm text-slate-400">Дата рождения</p>
                        <p className="text-white">{myProfile?.date_of_birth || '—'}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/50">
                        <p className="text-sm text-slate-400">Место рождения</p>
                        <p className="text-white">{myProfile?.birth_place || '—'}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/50 md:col-span-2">
                        <p className="text-sm text-slate-400">О себе</p>
                        <p className="text-white">{myProfile?.bio || '—'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};