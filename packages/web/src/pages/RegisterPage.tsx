import {RegisterForm} from '@/components/auth/RegisterForm';

export const RegisterPage = () => {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6 relative overflow-hidden">

        <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-[var(--primary)] rounded-full blur-[150px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-[var(--secondary)] rounded-full blur-[150px] opacity-15 animate-pulse delay-1000"></div>

        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5"></div>

      <div className="w-full max-w-lg relative z-10">
        <RegisterForm/>
      </div>
    </div>
  );
};