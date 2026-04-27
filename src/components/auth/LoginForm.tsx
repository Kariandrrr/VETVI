import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';


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
        navigate('/');
      }, 1500);
    } catch (error) {
      // Ошибка уже обработана в контексте
    }
  };

  const isLoading = form.formState.isSubmitting;

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-6">
      {/* Заголовок */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Добро пожаловать
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Войдите в приложение со своим аккаунтом
        </p>
      </div>

      {/* Алерты */}
      {authError && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            {authError}
          </AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <AlertDescription className="text-emerald-800 dark:text-emerald-200">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Форма */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Username or Email */}
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700 dark:text-slate-300">
                  Имя пользователя или Email
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="ivan или ivan@example.com"
                    {...field}
                    disabled={isLoading}
                    className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400 dark:border-emerald-800 dark:focus:border-emerald-600"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-slate-700 dark:text-slate-300">
                    Пароль
                  </FormLabel>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors"
                  >
                    Забыли пароль?
                  </Link>
                </div>
                <FormControl>
                  <Input
                    placeholder="••••••••"
                    type="password"
                    {...field}
                    disabled={isLoading}
                    className="border-cyan-200 focus:border-cyan-400 focus:ring-cyan-400 dark:border-cyan-800 dark:focus:border-cyan-600"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold py-2 rounded-lg transition-all duration-200 shadow-lg shadow-emerald-200 dark:shadow-emerald-950"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Вход...
              </>
            ) : (
              'Войти'
            )}
          </Button>
        </form>
      </Form>

      {/* Ссылка на регистрацию */}
      <p className="text-center text-slate-600 dark:text-slate-400">
        Нет аккаунта?{' '}
        <Link
          to="/register"
          className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold transition-colors"
        >
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
};