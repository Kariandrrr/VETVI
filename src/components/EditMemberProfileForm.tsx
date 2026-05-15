import {useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import * as z from 'zod';
import {Button} from '@/components/ui/button';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {toast} from 'sonner';

const editProfileSchema = z.object({
    display_name: z.string().optional().nullable(),
    bio: z.string().max(500, 'Не более 500 символов').optional().nullable(),
    date_of_birth: z.string().optional().nullable(),
    first_name: z.string().optional().nullable(),
    last_name: z.string().optional().nullable(),
    patronymic: z.string().optional().nullable(),
    gender: z.enum(['male', 'female', 'other', 'unknown']).optional().nullable(),
    birth_place: z.string().optional().nullable(),
    death_date: z.string().optional().nullable(),
    death_place: z.string().optional().nullable(),
    is_alive: z.boolean().optional(),
});

type EditProfileFormData = z.infer<typeof editProfileSchema>;

interface EditMemberProfileFormProps {
    initialData: EditProfileFormData;
    onSubmit: (data: EditProfileFormData) => Promise<void>;
    isSubmitting?: boolean;
    isAdmin?: boolean;
    isOwner?: boolean;
}

export const EditMemberProfileForm: React.FC<EditMemberProfileFormProps> = ({
    initialData,
    onSubmit,
    isSubmitting = false,
    isAdmin = false,
    isOwner = false,
}) => {
    const form = useForm<EditProfileFormData>({
        resolver: zodResolver(editProfileSchema),
        defaultValues: initialData,
    });

    useEffect(() => {
        form.reset(initialData);
    }, [initialData, form]);

    const handleSubmit = async (data: EditProfileFormData) => {
        try {
            await onSubmit(data);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Ошибка при сохранении');
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="last_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-300">Фамилия</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        value={field.value || ''}
                                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                                        placeholder="Иванов"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-300">Имя</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        value={field.value || ''}
                                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                                        placeholder="Иван"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="patronymic"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-300">Отчество</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        value={field.value || ''}
                                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                                        placeholder="Иванович"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="display_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-300">Отображаемое имя</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        value={field.value || ''}
                                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                                        placeholder="Как называть в семье"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-300">Пол</FormLabel>
                                <Select value={field.value || 'unknown'} onValueChange={field.onChange}>
                                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700">
                                        <SelectItem value="male">Мужской</SelectItem>
                                        <SelectItem value="female">Женский</SelectItem>
                                        <SelectItem value="other">Другой</SelectItem>
                                        <SelectItem value="unknown">Не указан</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="date_of_birth"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-300">Дата рождения</FormLabel>
                                <FormControl>
                                    <Input
                                        type="date"
                                        {...field}
                                        value={field.value || ''}
                                        className="bg-slate-800 border-slate-700 text-white"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="birth_place"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-300">Место рождения</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        value={field.value || ''}
                                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                                        placeholder="Город, страна"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-slate-300">О себе</FormLabel>
                            <FormControl>
                                <Textarea
                                    {...field}
                                    value={field.value || ''}
                                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none"
                                    rows={3}
                                    placeholder="Расскажите немного о себе..."
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Только для админов при редактировании чужого профиля */}
                {isAdmin && !isOwner && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="death_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Дата смерти</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                {...field}
                                                value={field.value || ''}
                                                className="bg-slate-800 border-slate-700 text-white"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="death_place"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Место смерти</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                value={field.value || ''}
                                                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                                                placeholder="Город, страна"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="is_alive"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-white">Статус</FormLabel>
                                        <p className="text-xs text-slate-400">Отметьте, если человек жив</p>
                                    </div>
                                    <FormControl>
                                        <input
                                            type="checkbox"
                                            className="h-5 w-5 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500"
                                            checked={field.value === true}
                                            onChange={(e) => field.onChange(e.target.checked)}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </>
                )}

                <div className="flex gap-2 justify-end pt-4">
                    <Button type="button" variant="outline" onClick={() => form.reset()}>
                        Сбросить
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-500 hover:to-cyan-500"
                    >
                        {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                    </Button>
                </div>
            </form>
        </Form>
    );
};