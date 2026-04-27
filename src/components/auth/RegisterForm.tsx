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


const registerSchema = z
  .object({
    display_name: z
      .string()
      .min(2, 'Имя должно содержать минимум 2 символа')
      .max(50, 'Имя не должно превышать 50 символов'),
    email: z
    .email({ error: 'Введите корректный email' })
    .max(255, { error: 'Email не должен превышать 255 символов' }),
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
  const { register: registerUser, error: authError } = useAuth();
  const [successMessage, setSuccessMessage] = useState('');

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
      setSuccessMessage('Регистрация успешна! Переход на главную...');
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
          Присоединяйтесь
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Создайте аккаунт для входа в приложение
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
          {/* Display Name */}
          <FormField
            control={form.control}
            name="display_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700 dark:text-slate-300">
                  Ваше имя
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Иван Петров"
                    {...field}
                    disabled={isLoading}
                    className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400 dark:border-emerald-800 dark:focus:border-emerald-600"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700 dark:text-slate-300">
                  Email
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="ivan@example.com"
                    type="email"
                    {...field}
                    disabled={isLoading}
                    className="border-cyan-200 focus:border-cyan-400 focus:ring-cyan-400 dark:border-cyan-800 dark:focus:border-cyan-600"
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
                <FormLabel className="text-slate-700 dark:text-slate-300">
                  Пароль
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="••••••••"
                    type="password"
                    {...field}
                    disabled={isLoading}
                    className="border-purple-200 focus:border-purple-400 focus:ring-purple-400 dark:border-purple-800 dark:focus:border-purple-600"
                  />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Минимум 8 символов, буквы и цифры
                </p>
              </FormItem>
            )}
          />

          {/* Confirm Password */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700 dark:text-slate-300">
                  Подтверждение пароля
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="••••••••"
                    type="password"
                    {...field}
                    disabled={isLoading}
                    className="border-purple-200 focus:border-purple-400 focus:ring-purple-400 dark:border-purple-800 dark:focus:border-purple-600"
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
                Регистрация...
              </>
            ) : (
              'Создать аккаунт'
            )}
          </Button>
        </form>
      </Form>

      {/* Ссылка на вход */}
      <p className="text-center text-slate-600 dark:text-slate-400">
        Уже есть аккаунт?{' '}
        <Link
          to="/login"
          className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold transition-colors"
        >
          Войти
        </Link>
      </p>
    </div>
  );
};