import {useNavigate, useParams} from 'react-router-dom';
import {MemberProfile} from '@/components/MemberProfile';
import {Button} from '@/components/ui/button';
import {ArrowLeftIcon} from 'lucide-react';

export const MemberProfilePage = () => {
  const { familyId, memberId } = useParams<{ familyId: string; memberId: string }>();
  const navigate = useNavigate();

  if (!familyId) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Семья не выбрана</p>
          <Button onClick={() => navigate('/families')}>Выбрать семью</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <Button
          variant="ghost"
          className="mb-6 gap-2 text-slate-400 hover:text-white"
          onClick={() => navigate(-1)}
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Назад
        </Button>

        <MemberProfile familyGroupId={familyId} memberId={memberId} />
      </div>
    </div>
  );
};