import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    Info,
    Plus,
    Search,
    Users,
    Maximize2,
    Minimize2,
    UserCircle,
    Trash2
} from 'lucide-react';
import { useFamilyTreeData } from '@/hooks/useFamilyTreeData';
import { useFamilies } from '@/hooks/useFamilies';
import { useAuth } from '@/hooks/useAuth';
import { FamilyTree } from '@/components/FamilyTree';
import { AddMemberModal } from '@/components/AddMemberModal';
import { type FamilyGroupRead, type FamilyMember, getMemberFullName } from '@/types/families';
import { familyApi } from '@/api/family';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

const getFullNameFromMember = (member: FamilyMember): string => {
    const parts = [member.last_name, member.first_name, member.patronymic].filter(Boolean);
    return parts.join(' ') || 'Без имени';
};

const getTableNameFromMember = (member: FamilyMember): string => {
    return getFullNameFromMember(member);
};

const getInitials = (member: FamilyMember): string => {
    const firstName = member.first_name || '';
    const lastName = member.last_name || '';
    const firstInitial = firstName[0] || '';
    const lastInitial = lastName[0] || '';
    const initials = `${firstInitial}${lastInitial}`.toUpperCase();
    return initials || '?';
};

export const FamilyTreePage = () => {
    const { id: familyId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { data: familiesRaw } = useFamilies();

    const families = Array.isArray(familiesRaw)
        ? familiesRaw
        : (familiesRaw as { data?: FamilyGroupRead[] })?.data ?? [];

    const currentFamily = families.find((f: FamilyGroupRead) => f.id === familyId);
    const memberships = currentFamily?.memberships ?? [];
    const membership = memberships.find((m: { user_id: string; role: string }) => m.user_id === user?.id);
    const isAdmin = membership?.role === 'admin';

    const { members, relationships, isLoading, refetch } = useFamilyTreeData(familyId);
    const [isTableExpanded, setIsTableExpanded] = useState(true);
    const [showAddMember, setShowAddMember] = useState(false);
    const [search, setSearch] = useState('');
    const [isTreeFullscreen, setIsTreeFullscreen] = useState(false);

    const validMembers = useMemo(() =>
        members?.filter(m => m && m.id) || [],
        [members]
    );

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isTreeFullscreen) setIsTreeFullscreen(false);
        };
        if (isTreeFullscreen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [isTreeFullscreen]);

    const filtered = useMemo(
        () =>
            validMembers.filter((m: FamilyMember) =>
                getMemberFullName(m).toLowerCase().includes(search.toLowerCase())
            ),
        [validMembers, search]
    );

    // Обработчик перехода на профиль для редактирования
    const handleEditMember = (memberId: string) => {
        navigate(`/families/${familyId}/members/${memberId}`);
    };

    const handleDeleteMember = async (member: FamilyMember) => {
    const fullName = getFullNameFromMember(member);
    if (!confirm(`Вы уверены, что хотите полностью удалить ${fullName}?`)) return;

    try {
        await familyApi.deleteMember(member.id);
        toast.success('Участник удалён');
        await refetch();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        toast.error('Ошибка', { description: 'Не удалось удалить участника' });
    }
};

//     const handleRemoveFromFamily = async (member: FamilyMember) => {
//     const fullName = getFullNameFromMember(member);
//     if (!confirm(`Вы уверены, что хотите исключить ${fullName} из семьи?`)) return;
//
//     try {
//         await familyApi.removeUserFromFamily(familyId!, member.linked_user_id!);
//         toast.success('Пользователь исключён из семьи');
//         await refetch();
//         // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     } catch (error) {
//         toast.error('Ошибка', { description: 'Не удалось исключить пользователя' });
//     }
// };

    const handleViewProfile = (memberId: string) => {
        navigate(`/families/${familyId}/members/${memberId}`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            {/* Header - без изменений */}
            <header className="sticky top-0 z-50 backdrop-blur-2xl bg-black/30 border-b border-[var(--glass-border)]">
                <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between h-16">
                    <div className="flex items-center gap-4">
                        <img src={logo} alt="VETVI" className="w-10 h-10 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                        <h1 className="text-xl font-black text-white tracking-tighter bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">VETVI</h1>
                    </div>
                    <Button onClick={() => navigate('/families')} variant="ghost" className="text-slate-300 hover:text-white">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        К группам
                    </Button>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
                {/* Таблица участников */}
                <div className="glass-card overflow-visible transition-all duration-300">
                    <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setIsTableExpanded(!isTableExpanded)}>
                        <div className="flex items-center gap-3 group/tooltip relative">
                            <Users className="w-5 h-5 text-[var(--secondary)]" />
                            <span className="font-semibold text-white">
                                На дереве ({validMembers.length})
                                {search && ` • найдено: ${filtered.length}`}
                            </span>
                            <div className="relative inline-flex items-center justify-center w-4 h-4 cursor-help">
                                <Info className="w-4 h-4 text-slate-500 hover:text-slate-300 transition-colors" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 w-64 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs text-slate-300 shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 pointer-events-none z-50">
                                    <p className="font-semibold text-white mb-1">Узлы на древе</p>
                                    <ul className="mt-2 space-y-1 list-disc list-inside text-slate-400">
                                        <li>Зарегистрированные пользователи</li>
                                        <li>Родственники, добавленные вручную</li>
                                        <li>Умершие или ещё не приглашённые</li>
                                    </ul>
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--glass-bg)]" />
                                </div>
                            </div>
                        </div>
                        {isTableExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </div>

                    {isTableExpanded && (
                        <div className="p-5 pt-0 border-t border-[var(--glass-border)] space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <Input placeholder="Поиск по имени..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-black/20 border-[var(--glass-border)] text-white h-10 pl-10" />
                            </div>
                            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
                                {filtered.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500">Участников не найдено</div>
                                ) : (
                                    filtered.map((member: FamilyMember) => {
                                        // Определяем статусы
                                        const isAlive = member.is_alive !== false;
                                        const hasAccount = member.linked_user_id !== null && member.linked_user_id !== undefined;
                                        // Редактировать можно только если НЕТ привязанного аккаунта
                                        const canEdit = !hasAccount;

                                        return (
                                            <div
                                                key={member.id}
                                                className={`group flex items-center gap-4 p-3 rounded-xl transition-colors ${
                                                    isAlive 
                                                        ? 'bg-emerald-900/10 hover:bg-emerald-900/20 border-l-2 border-l-emerald-500/30' 
                                                        : 'bg-slate-800/20 hover:bg-slate-800/30 border-l-2 border-l-slate-500/20'
                                                }`}
                                            >
                                                {/* Аватар */}
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${
                                                    isAlive 
                                                        ? 'bg-gradient-to-br from-emerald-500 to-teal-400' 
                                                        : 'bg-gradient-to-br from-slate-500 to-gray-400'
                                                }`}>
                                                    {member.avatar_url ? (
                                                        <img src={member.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                                                    ) : (
                                                        getInitials(member)
                                                    )}
                                                </div>

                                                {/* Информация об участнике */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className={`font-medium truncate ${isAlive ? 'text-white' : 'text-slate-300'}`}
                                                           title={getFullNameFromMember(member)}>
                                                            {getTableNameFromMember(member)}
                                                        </p>
                                                        {!isAlive && (
                                                            <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300">
                                                                🕊️ Умер(ла)
                                                            </span>
                                                        )}
                                                        {hasAccount && (
                                                            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                                                                🔗 с аккаунтом
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className={`text-xs ${isAlive ? 'text-slate-400' : 'text-slate-500'}`}>
                                                        {member.gender === 'male' ? 'Мужчина' : member.gender === 'female' ? 'Женщина' : 'Не указано'}
                                                    </p>
                                                </div>

                                                {/* Кнопки действий */}
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {isAdmin && (
                                                        <>
                                                            {/* Кнопка редактирования - только для пользователей БЕЗ аккаунта */}
                                                            {canEdit && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 p-0 text-slate-400 hover:text-blue-400 hover:bg-blue-500/20"
                                                                    title="Редактировать"
                                                                    onClick={() => handleEditMember(member.id)}
                                                                >
                                                                    ✏️
                                                                </Button>
                                                            )}

                                                            {/* Кнопка исключения из семьи - для пользователей С аккаунтом */}
                                                            {/*{hasAccount && (*/}
                                                            {/*    <Button*/}
                                                            {/*        size="sm"*/}
                                                            {/*        variant="ghost"*/}
                                                            {/*        className="h-8 w-8 p-0 text-slate-400 hover:text-orange-400 hover:bg-orange-500/20"*/}
                                                            {/*        title="Исключить из семьи"*/}
                                                            {/*        onClick={() => handleRemoveFromFamily(member)}*/}
                                                            {/*    >*/}
                                                            {/*        <DoorOpen className="w-4 h-4" />*/}
                                                            {/*    </Button>*/}
                                                            {/*)}*/}

                                                            {/* Кнопка полного удаления - только для пользователей БЕЗ аккаунта */}
                                                            {!hasAccount && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/20"
                                                                    title="Полностью удалить"
                                                                    onClick={() => handleDeleteMember(member)}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className={`border-[var(--glass-border)] hover:bg-[var(--glass-bg)] ${
                                                            isAlive ? 'text-slate-300' : 'text-slate-400'
                                                        }`}
                                                        onClick={() => handleViewProfile(member.id)}
                                                    >
                                                        <UserCircle className="w-4 h-4 mr-1" />
                                                        Профиль
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Семейное древо - без изменений */}
                <div className="glass-card overflow-hidden relative">
                    <div className="border-b border-[var(--glass-border)] p-5 flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Users className="w-5 h-5 text-[var(--secondary)]" />
                                Семейное древо
                            </h2>
                            <p className="text-sm text-slate-400 mt-1">
                                {validMembers.length} участников, {relationships?.length || 0} связей
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {validMembers.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsTreeFullscreen(true)}
                                    className="w-10 h-10 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-slate-400 hover:text-white hover:bg-[var(--primary)]/20 transition-all"
                                    title="Развернуть на весь экран"
                                >
                                    <Maximize2 className="w-5 h-5" />
                                </Button>
                            )}

                            <Button
                                onClick={() => setShowAddMember(true)}
                                className="bg-[var(--secondary)] hover:bg-cyan-300 text-[var(--secondary-foreground)] rounded-full h-10 font-bold shadow-[var(--neon-glow-secondary)] transition-all"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Новый родственник
                            </Button>
                        </div>
                    </div>

                    <div className="p-4 bg-black/10">
                        <FamilyTree members={validMembers} relationships={relationships || []} fullscreen={false} />
                    </div>
                </div>
            </main>

            {/* Модалка добавления */}
            {familyId && (
                <AddMemberModal
                    key={`add-member-${familyId}`}
                    familyId={familyId}
                    open={showAddMember}
                    onOpenChange={setShowAddMember}
                    onAddSuccess={async () => {
                        await refetch();
                        setShowAddMember(false);
                    }}
                />
            )}

            {/* Полноэкранный режим - без изменений */}
            {isTreeFullscreen && currentFamily && (
                <div className="fixed inset-0 z-[100] bg-[var(--background)] flex flex-col">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)] bg-black/30 backdrop-blur-xl shrink-0">
                        <div className="flex items-center gap-3">
                            <img src={logo} alt="VETVI" className="w-8 h-8" />
                            <h3 className="text-xl font-bold text-white">{currentFamily.name}</h3>
                            {currentFamily.description && <span className="text-sm text-slate-400 hidden md:inline">• {currentFamily.description}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="hidden md:flex items-center gap-4 text-sm text-slate-400 mr-4">
                                <span>👥 {validMembers.length} участников</span>
                                <span>🔗 {relationships?.length || 0} связей</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsTreeFullscreen(false)}
                                className="w-10 h-10 rounded-xl bg-[var(--glass-bg)] hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"
                                title="Свернуть (Esc)"
                            >
                                <Minimize2 className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 w-full" onClick={(e) => e.stopPropagation()}>
                        <FamilyTree members={validMembers} relationships={relationships || []} fullscreen={true} />
                    </div>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs text-slate-400 pointer-events-none z-[101]">
                        Нажмите <kbd className="px-2 py-0.5 rounded bg-black/30 font-mono">Esc</kbd> или кнопку ⤢ для выхода
                    </div>
                </div>
            )}
        </div>
    );
};