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

const memberDataSchema = z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    patronymic: z.string().optional().nullable(),
    gender: z.enum(['male', 'female', 'other', 'unknown']).optional(),
    birth_place: z.string().optional().nullable(),
    date_of_birth: z.string().optional().nullable(),
    bio: z.string().max(500).optional().nullable(),
});

type MemberDataFormData = z.infer<typeof memberDataSchema>;

interface EditFamilyMemberDataFormProps {
    initialData: MemberDataFormData;
    onSubmit: (data: MemberDataFormData) => Promise<void>;
    isSubmitting?: boolean;
}

export const EditFamilyMemberDataForm: React.FC<EditFamilyMemberDataFormProps> = ({
    initialData,
    onSubmit,
    isSubmitting = false,
}) => {
    const form = useForm<MemberDataFormData>({
        resolver: zodResolver(memberDataSchema),
        defaultValues: {
            first_name: initialData?.first_name || '',
            last_name: initialData?.last_name || '',
            patronymic: initialData?.patronymic || '',
            gender: initialData?.gender || 'unknown',
            birth_place: initialData?.birth_place || '',
            date_of_birth: initialData?.date_of_birth || '',
            bio: initialData?.bio || '',
        },
    });

    useEffect(() => {
        console.log('Updating form with new initialData:', initialData);
        form.reset({
            first_name: initialData?.first_name || '',
            last_name: initialData?.last_name || '',
            patronymic: initialData?.patronymic || '',
            gender: initialData?.gender || 'unknown',
            birth_place: initialData?.birth_place || '',
            date_of_birth: initialData?.date_of_birth || '',
            bio: initialData?.bio || '',
        });
    }, [initialData, form]);

    const handleSubmit = async (data: MemberDataFormData) => {
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

                <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-slate-300">Пол</FormLabel>
                            <Select
                                value={field.value || 'unknown'}
                                onValueChange={field.onChange}
                            >
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
                                    rows={4}
                                    placeholder="Расскажите немного о себе..."
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex gap-2 justify-end pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            form.reset({
                                first_name: initialData?.first_name || '',
                                last_name: initialData?.last_name || '',
                                patronymic: initialData?.patronymic || '',
                                gender: initialData?.gender || 'unknown',
                                birth_place: initialData?.birth_place || '',
                                date_of_birth: initialData?.date_of_birth || '',
                                bio: initialData?.bio || '',
                            });
                        }}
                    >
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