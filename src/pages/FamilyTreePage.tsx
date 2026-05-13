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
    UserCircle
} from 'lucide-react';
import { useFamilyTreeData } from '@/hooks/useFamilyTreeData';
import { useFamilies } from '@/hooks/useFamilies';
import { useAuth } from '@/hooks/useAuth';
import { FamilyTree } from '@/components/FamilyTree';
import { AddMemberModal } from '@/components/AddMemberModal';
import { type FamilyGroupRead, type FamilyMember, getMemberFullName } from '@/types/families';
import logo from '@/assets/logo.png';

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

  // Закрытие по Esc
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
      members.filter((m: FamilyMember) =>
        getMemberFullName(m).toLowerCase().includes(search.toLowerCase())
      ),
    [members, search]
  );

  // Если нет данных или загрузка
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

    const handleViewProfile = (memberId: string) => {
    navigate(`/families/${familyId}/members/${memberId}`);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Header */}
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
        {/* 🔽 Таблица участников */}
        <div className="glass-card overflow-visible transition-all duration-300">
          <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setIsTableExpanded(!isTableExpanded)}>
            <div className="flex items-center gap-3 group/tooltip relative">
              <Users className="w-5 h-5 text-[var(--secondary)]" />
              <span className="font-semibold text-white">
                На дереве ({members.length})
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
                  filtered.map((member: FamilyMember) => (
                    <div key={member.id} className="group flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-white font-bold shrink-0">
                        {member.avatar_url ? (
                          <img src={member.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                        ) : (
                          `${member.first_name[0]}${member.last_name[0]}`.toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{getMemberFullName(member)}</p>
                        <p className="text-xs text-slate-400">
                          {member.gender === 'male' ? 'Мужчина' : member.gender === 'female' ? 'Женщина' : 'Не указано'}
                        </p>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-blue-400 hover:bg-blue-500/20" title="Редактировать">✏️</Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/20" title="Удалить">🗑️</Button>
                                                    <Button
                            size="sm"
                            variant="outline"
                            className="border-[var(--glass-border)] hover:bg-[var(--glass-bg)] text-slate-300"
                            onClick={() => handleViewProfile(member.id)}
                          >
                            <UserCircle className="w-4 h-4 mr-1" />
                            Профиль
                          </Button>
                        </div>
                      )}
                                            {!isAdmin && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[var(--glass-border)] hover:bg-[var(--glass-bg)] text-slate-300"
                          onClick={() => handleViewProfile(member.id)}
                        >
                          <UserCircle className="w-4 h-4 mr-1" />
                          Профиль
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 🌳 Дерево - с кнопкой полноэкранного режима */}
        <div className="glass-card overflow-hidden relative">
          {/* Заголовок с кнопками */}
          <div className="border-b border-[var(--glass-border)] p-5 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[var(--secondary)]" />
                Семейное древо
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {members.length} участников, {relationships.length} связей
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* 🔲 Кнопка полноэкранного режима */}
              {members.length > 0 && (
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

          {/* Дерево */}
          <div className="p-4 bg-black/10">
            <FamilyTree members={members} relationships={relationships} fullscreen={false} />
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

      {/* 🖥️ Полноэкранный оверлей */}
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
                <span>👥 {members.length} участников</span>
                <span>🔗 {relationships.length} связей</span>
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
            <FamilyTree members={members} relationships={relationships} fullscreen={true} />
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs text-slate-400 pointer-events-none z-[101]">
            Нажмите <kbd className="px-2 py-0.5 rounded bg-black/30 font-mono">Esc</kbd> или кнопку ⤢ для выхода
          </div>
        </div>
      )}
    </div>
  );
};