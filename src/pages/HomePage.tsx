import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, Plus, Users, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FamilyTree } from '@/components/FamilyTree';
import { useState } from 'react';

export const HomePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showAddMember, setShowAddMember] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-cyan-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-emerald-200 dark:border-emerald-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 via-cyan-600 to-purple-600 dark:from-emerald-400 dark:via-cyan-400 dark:to-purple-400 bg-clip-text text-transparent">
                  VETVI
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Дерево родственников
                </p>
              </div>
            </div>

            {/* Center - Welcome */}
            <div className="flex-1 flex justify-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Добро пожаловать,{' '}
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {user?.display_name}
                </span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                onClick={() => setShowAddMember(!showAddMember)}
                className="bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-950 hidden sm:flex"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить родственника
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400"
              >
                <Settings className="w-5 h-5" />
              </Button>

              <Button
                onClick={handleLogout}
                variant="ghost"
                size="icon"
                className="text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Mobile Action Button */}
          <div className="sm:hidden pb-4">
            <Button
              onClick={() => setShowAddMember(!showAddMember)}
              className="w-full bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-500 hover:to-cyan-500 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить члена семьи
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Card */}
        <div className="mb-8 p-6 bg-white dark:bg-slate-900 rounded-lg border border-emerald-200 dark:border-emerald-900 shadow-lg shadow-emerald-100 dark:shadow-emerald-950">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            👋 Привет, {user?.display_name}!
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Здесь вы можете создавать и управлять своим деревом родственников.
            Добавляйте членов семьи, указывайте родственные связи и визуализируйте
            структуру вашей семьи.
          </p>
        </div>

        {/* Family Tree Section */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-emerald-200 dark:border-emerald-900 shadow-lg shadow-emerald-100 dark:shadow-emerald-950 overflow-hidden">
          <div className="border-b border-emerald-200 dark:border-emerald-900 p-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-cyan-600 to-purple-600 dark:from-emerald-400 dark:via-cyan-400 dark:to-purple-400 bg-clip-text text-transparent">
              📊 Ваше дерево семьи
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Визуализация и управление структурой вашей семьи
            </p>
          </div>

          {/* Family Tree Component */}
          <div className="p-6 min-h-[600px] bg-gradient-to-br from-emerald-50/50 via-cyan-50/50 to-purple-50/50 dark:from-slate-800/50 dark:via-slate-800/30 dark:to-slate-800/50">
            <FamilyTree
              showAddMember={showAddMember}
              onAddMemberClose={() => setShowAddMember(false)}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <StatsCard
            icon="👨‍👩‍👧‍👦"
            title="Члены семьи"
            value="0"
            description="Всего людей в дереве"
          />
          <StatsCard
            icon="🌳"
            title="Поколения"
            value="0"
            description="Уровней в дереве"
          />
          <StatsCard
            icon="🔗"
            title="Связи"
            value="0"
            description="Родственных отношений"
          />
        </div>
      </main>
    </div>
  );
};

// Stats Card Component
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
  <div className="bg-white dark:bg-slate-900 rounded-lg border border-emerald-200 dark:border-emerald-900 p-6 shadow-lg shadow-emerald-100 dark:shadow-emerald-950 hover:shadow-xl hover:shadow-emerald-200 dark:hover:shadow-emerald-950 transition-all duration-200">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
          {title}
        </p>
        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
          {value}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {description}
        </p>
      </div>
      <span className="text-4xl">{icon}</span>
    </div>
  </div>
);