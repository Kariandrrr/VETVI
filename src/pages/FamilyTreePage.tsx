import {useMemo, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {ArrowLeft, ChevronDown, ChevronUp, Plus, Search, Users} from 'lucide-react';
import {useFamilyTreeData} from '@/hooks/useFamilyTreeData';
import {FamilyTree} from '@/components/FamilyTree';
import {AddMemberModal} from '@/components/AddMemberModal';
import {getMemberFullName} from '@/types/families';
import logo from '@/assets/logo.png';

export const FamilyTreePage = () => {
  const { id: familyId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { members, relationships, isLoading, refetch } = useFamilyTreeData(familyId);

  const [isTableExpanded, setIsTableExpanded] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() =>
    members.filter(m => getMemberFullName(m).toLowerCase().includes(search.toLowerCase())),
  [members, search]);

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
            <ArrowLeft className="w-4 h-4 mr-2" /> К группам
          </Button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
        {/* 🔽 Таблица участников (в самом начале) */}
        <div className="glass-card overflow-hidden transition-all duration-300">
          <div
            className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => setIsTableExpanded(!isTableExpanded)}
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-[var(--secondary)]" />
              <span className="font-semibold text-white">Участники семьи ({filtered.length})</span>
            </div>
            {isTableExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </div>

          {isTableExpanded && (
            <div className="p-5 pt-0 border-t border-[var(--glass-border)] space-y-4">
              {/* Поиск */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Поиск по имени..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-black/20 border-[var(--glass-border)] text-white h-10 pl-10"
                />
              </div>

              {/* Список */}
              <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
                {isLoading ? (
                  <div className="text-center py-8 text-slate-500">Загрузка...</div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">Участников не найдено</div>
                ) : (
                  filtered.map(member => (
                    <div key={member.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-white font-bold shrink-0">
                        {member.avatar_url ? <img src={member.avatar_url} className="w-full h-full rounded-full object-cover" /> : `${member.first_name[0]}${member.last_name[0]}`.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{getMemberFullName(member)}</p>
                        <p className="text-xs text-slate-400">{member.gender === 'male' ? 'Мужчина' : member.gender === 'female' ? 'Женщина' : 'Не указано'}</p>
                      </div>
                      <Button size="sm" variant="outline" className="border-[var(--glass-border)] hover:bg-[var(--glass-bg)] text-slate-300">
                        Профиль
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/*  Дерево */}
        <div className="relative">
          <div className="absolute -top-4 right-4 z-10">
            <Button onClick={() => setShowAddMember(true)} className="bg-[var(--secondary)] hover:bg-cyan-300 text-[var(--secondary-foreground)] rounded-full h-10 font-bold shadow-[var(--neon-glow-secondary)] transition-all">
              <Plus className="w-4 h-4 mr-2" /> Новый родственник
            </Button>
          </div>
          <FamilyTree members={members} relationships={relationships} />
        </div>
      </main>

      {/* Модалка добавления */}
      {familyId && (
        <AddMemberModal
          key={`add-member-${familyId}`}
          familyId={familyId}
          open={showAddMember}
          onOpenChange={setShowAddMember}
          onAddSuccess={() => {
            refetch();
            setShowAddMember(false);
          }}
        />
      )}
    </div>
  );
};