import {useAuth} from '@/hooks/useAuth';
import {Button} from '@/components/ui/button';
import {Link2, LogOut, Plus, Settings, Users, Zap} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {JoinByLinkModal} from '@/components/JoinByLinkModal';
import {FamilyTree} from '@/components/FamilyTree';
import {useState} from 'react';
import logo from '@/assets/logo.png';

export const HomePage = () => {
  const {  logout } = useAuth();
  const navigate = useNavigate();
  const [showAddMember, setShowAddMember] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

const primaryBtnClass =
    "px-6 py-3 bg-gradient-to-r from-[var(--secondary)] to-[var(--primary)] hover:from-cyan-400 hover:to-purple-400 text-white font-medium rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all duration-300 hover:-translate-y-0.5 active:scale-95 flex items-center gap-2";
const [showJoinModal, setShowJoinModal] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-black/30 border-b border-[var(--glass-border)]">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between h-16 gap-6">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <img
                  src={logo}
                  alt="VETVI Logo"
                  className="w-12 h-12 object-contain drop-shadow-[0_0_12px_rgba(168,85,247,0.6)] transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <div className="hidden md:block">
                <h1 className="text-2xl font-black text-white tracking-tighter bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
                  VETVI
                </h1>
                <p className="text-xs text-slate-500 tracking-wider uppercase -mt-1">
                  Архив семейных связей
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={() => setShowAddMember(!showAddMember)} className={primaryBtnClass}>
                <Plus className="w-5 h-5" />
                Новый родственник
              </Button>

        <Button onClick={() => navigate('/families')} className={primaryBtnClass}>
          <Users className="w-5 h-5" />
          Семейные группы
        </Button>

                <Button
            onClick={() => setShowJoinModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
          >
            <Link2 className="w-5 h-5" />
            <span className="hidden md:inline">Вступить по ссылке</span>
          </Button>


              <Button
                variant="ghost"
                size="icon"
                className="rounded-full w-11 h-11 text-slate-400 hover:text-white hover:bg-[var(--glass-bg)] border border-transparent hover:border-[var(--glass-border)] transition-all"
              >
                <Settings className="w-5 h-5" />
              </Button>

              <Button
                onClick={handleLogout}
                variant="ghost"
                size="icon"
                className="rounded-full w-11 h-11 text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-all"
              >
                <LogOut className="w-5 h-5" />
              </Button>
                <JoinByLinkModal open={showJoinModal} onOpenChange={setShowJoinModal} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-16 space-y-16 relative">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[var(--primary)] rounded-full blur-[180px] opacity-10"></div>

        <div className="p-10 glass-card relative group">
          <div className="absolute top-6 right-6 w-14 h-14 rounded-2xl bg-[var(--glass-bg)] flex items-center justify-center border border-[var(--glass-border)]">
            <Zap className="w-7 h-7 text-[var(--secondary)] drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tighter mb-4 max-w-xl">
            Центр управления деревом
          </h2>
          <p className="text-slate-300 text-lg max-w-4xl leading-relaxed">
            Это ваше цифровое пространство для исследования родословной. Визуализируйте, дополняйте и храните историю вашей семьи в защищенной и современной среде Vetvi. Начните с добавления первого родственника!
          </p>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="border-b border-[var(--glass-border)] p-10 flex items-center justify-between gap-6 flex-wrap">
            <div>
              <h2 className="text-3xl font-extrabold text-white tracking-tighter">
                Семейный архив
              </h2>
              <p className="text-slate-400 text-lg mt-1 max-w-md">
                Интерактивная карта ваших родственных отношений
              </p>
            </div>
            <Button
              onClick={() => setShowAddMember(!showAddMember)}
              className="sm:hidden bg-[var(--secondary)] hover:bg-cyan-300 text-[var(--secondary-foreground)] rounded-full h-12 w-full font-bold shadow-[var(--neon-glow-secondary)] transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              Добавить родственника
            </Button>
          </div>

          <div className="p-4 min-h-[650px] bg-black/10">
            <FamilyTree
              showAddMember={showAddMember}
              onAddMemberClose={() => setShowAddMember(false)}
            />
          </div>
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-16">
          <StatsCard icon="👨‍👩‍👧‍👦" title="Всего в архиве" value="0" description="Членов семьи" />
          <StatsCard icon="🌳" title="Глубина истории" value="0" description="Поколений" />
          <StatsCard icon="🔗" title="Установлено" value="0" description="Связей" />
        </div>
      </main>
    </div>
  );
};

interface StatsCardProps {
  icon: string;
  title: string;
  value: string;
  description: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  title,
  value,
  description,
}) => (
  <div className="glass-card p-10 hover:border-[var(--primary)] hover:scale-[1.02] transition-all duration-300 group relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    <div className="flex items-start justify-between gap-6 relative z-10">
      <div className="space-y-2">
        <p className="text-sm text-slate-500 font-semibold tracking-wider uppercase">{title}</p>
        <p className="text-5xl font-extrabold text-white tracking-tighter bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
          {value}
        </p>
        <p className="text-sm text-slate-400 pt-1">{description}</p>
      </div>
      <span className="text-6xl group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-300">
        {icon}
      </span>
    </div>
  </div>
);