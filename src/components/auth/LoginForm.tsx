import {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import * as z from 'zod';
import {useAuth} from '@/hooks/useAuth';
import {AlertCircle, CheckCircle2, Eye, EyeOff, Loader2} from 'lucide-react';
import {Alert, AlertDescription} from '@/components/ui/alert';
import logo from '@/assets/logo.png';

const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Введите имя пользователя или email'),
  password: z
    .string()
    .min(1, 'Введите пароль'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const navigate = useNavigate();
  const { login, error: authError } = useAuth();
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setSuccessMessage('');
      await login(data.username, data.password);
      setSuccessMessage('Вход выполнен! Переход на главную...');
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1500);
    } catch (error) {
      console.error("Caught error in LoginForm:", error);
    }
  };

  const isLoading = form.formState.isSubmitting;

  return (
    <div className="w-full max-w-lg mx-auto bg-white/[0.03] border border-white/10 backdrop-blur-xl p-10 rounded-[32px] shadow-2xl space-y-10 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>

      {/* Заголовок с логотипом */}
      <div className="space-y-4 text-center relative z-10">
        <div className="mx-auto mb-6">
          <img
            src={logo}
            alt="VETVI Logo"
            className="mx-auto w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-transform duration-500 hover:scale-110"
          />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tighter bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
          С возвращением
        </h1>
        <p className="text-slate-400 text-lg max-w-xs mx-auto">
          Войдите, чтобы продолжить работу с вашим древом
        </p>
      </div>

      {/* Алерты */}
      {authError && (
        <Alert variant="destructive" className="rounded-2xl bg-red-950/30 border-red-800 text-red-200">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="border-cyan-500/50 bg-cyan-950/30 text-cyan-400 rounded-2xl">
          <CheckCircle2 className="h-5 w-5" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Форма */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 relative z-10">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-semibold text-slate-300 uppercase tracking-wider px-1">
                  Email
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="ivan@vetvi.ru"
                    {...field}
                    disabled={isLoading}
                    className="rounded-2xl h-12 bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                  />
                </FormControl>
                <FormMessage className="text-xs text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <FormLabel className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    Пароль
                  </FormLabel>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      {...field}
                      disabled={isLoading}
                      className="rounded-2xl h-12 bg-black/20 border-white/10 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-red-400" />
              </FormItem>
            )}
          />

          {/* Кнопка в неоновом стиле */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white font-bold text-lg shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all duration-300"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                Авторизация...
              </>
            ) : (
              'Войти в аккаунт'
            )}
          </Button>
        </form>
      </Form>

      {/* Ссылка на регистрацию */}
      <p className="text-center text-slate-400 relative z-10 pt-4">
        Нет аккаунта?{' '}
        <Link
          to="/register"
          className="text-cyan-400 hover:text-white font-bold transition-colors decoration-dotted hover:underline"
        >
          Создать бесплатно
        </Link>
      </p>
    </div>
  );
};