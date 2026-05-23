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

const registerSchema = z
  .object({
    display_name: z
      .string()
      .min(2, 'Имя должно содержать минимум 2 символа')
      .max(50, 'Имя не должно превышать 50 символов'),
    email: z
      .string()
      .email({ message: 'Введите корректный email' })
      .max(255, 'Email не должен превышать 255 символов'),
    password: z
      .string()
      .min(8, 'Пароль должен содержать минимум 8 символов')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Пароль должен содержать прописные, строчные буквы и цифры'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterForm = () => {
  const navigate = useNavigate();
  const { register: registerUser, login, error: authError } = useAuth();
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      display_name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setSuccessMessage('');

      await registerUser({
        display_name: data.display_name,
        email: data.email,
        password: data.password,
      });

      setSuccessMessage('Регистрация успешна! Вход в систему...');
      await login(data.email, data.password);

      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1000);
    } catch (error) {
      console.error("Caught error in RegisterForm:", error);
      setSuccessMessage('');
    }
  };

  const isLoading = form.formState.isSubmitting;

  return (
    <div className="w-full max-w-lg mx-auto glass-card p-10 space-y-10 relative overflow-hidden group">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--primary)] rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-500"></div>

      {/* Заголовок с Логотипом */}
      <div className="space-y-4 text-center relative z-10">
        <div className="mx-auto mb-6">
          <img
            src={logo}
            alt="VETVI Logo"
            className="mx-auto w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-transform duration-500 hover:scale-110"
          />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tighter bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
          Начните историю
        </h1>
        <p className="text-slate-400 text-lg max-w-sm mx-auto leading-normal">
          Создайте аккаунт и визуализируйте связи вашего рода
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 relative z-10">
          {/* Имя */}
          <FormField
            control={form.control}
            name="display_name"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-semibold text-slate-200 tracking-wide uppercase px-1">
                  Ваше имя
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    placeholder="Алексей Смирнов"
                    disabled={isLoading}
                    className="neon-input rounded-2xl h-12 bg-black/20 border-[var(--glass-border)] text-white placeholder:text-slate-600 focus:bg-black/40"
                  />
                </FormControl>
                <FormMessage className="text-xs text-red-400 px-1" />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-semibold text-slate-200 tracking-wide uppercase px-1">
                  Электронная почта
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="alex@vetvi.ru"
                    disabled={isLoading}
                    className="neon-input rounded-2xl h-12 bg-black/20 border-[var(--glass-border)] text-white placeholder:text-slate-600 focus:bg-black/40"
                  />
                </FormControl>
                <FormMessage className="text-xs text-red-400 px-1" />
              </FormItem>
            )}
          />

          {/* Пароль с кнопкой показа */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-semibold text-slate-200 tracking-wide uppercase px-1">
                  Придумайте пароль
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      disabled={isLoading}
                      className="neon-input rounded-2xl h-12 bg-black/20 border-[var(--glass-border)] text-white placeholder:text-slate-600 focus:bg-black/40 pr-12"
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
                <p className="text-xs text-slate-500 pt-1 px-1">
                  A-z, 0-9, мин. 8 символов
                </p>
                <FormMessage className="text-xs text-red-400 px-1" />
              </FormItem>
            )}
          />

          {/* Подтверждение пароля с кнопкой показа */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-semibold text-slate-200 tracking-wide uppercase px-1">
                  Повторите пароль
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      disabled={isLoading}
                      className="neon-input rounded-2xl h-12 bg-black/20 border-[var(--glass-border)] text-white placeholder:text-slate-600 focus:bg-black/40 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-red-400 px-1" />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-indigo-700 hover:to-indigo-600 text-white transition-all duration-300 font-bold text-lg tracking-tight shadow-[var(--neon-glow-primary)] hover:shadow-[0_0_25px_rgba(168,85,247,0.7)]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                Инициализация...
              </>
            ) : (
              'Присоединиться к Vetvi'
            )}
          </Button>
        </form>
      </Form>

      <p className="text-center text-slate-400 relative z-10">
        Уже в системе?{' '}
        <Link
          to="/login"
          className="text-[var(--secondary)] hover:text-white font-semibold transition-colors decoration-dotted hover:underline"
        >
          Войти в аккаунт
        </Link>
      </p>
    </div>
  );
};