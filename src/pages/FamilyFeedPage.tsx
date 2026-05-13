import {useNavigate, useParams} from 'react-router-dom';
import {FamilyFeed} from '@/components/FamilyFeed';
import {Button} from '@/components/ui/button';
import {ArrowLeftIcon, UsersIcon} from 'lucide-react';

export const FamilyFeedPage = () => {
  const { familyId } = useParams<{ familyId: string }>();
  const navigate = useNavigate();

  if (!familyId) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <UsersIcon className="w-16 h-16 mx-auto mb-4 text-slate-500" />
          <p className="text-slate-400 mb-4">Семья не выбрана</p>
          <Button onClick={() => navigate('/families')}>Выбрать семью</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-[1000px] mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full w-10 h-10 text-slate-400 hover:text-white"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tighter">
              Семейная лента
            </h1>
            <p className="text-slate-400 mt-1">
              Публикации и новости вашей семьи
            </p>
          </div>
        </div>

        <FamilyFeed familyGroupId={familyId} />
      </div>
    </div>
  );
};