import {useCallback, useEffect, useRef, useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import * as z from 'zod';
import {Button} from '@/components/ui/button';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {CameraIcon, Loader2, XIcon} from 'lucide-react';
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
    initialAvatarUrl?: string | null;
    onSubmit: (data: EditProfileFormData, avatarFile?: File) => Promise<void>;
    onAvatarRemove?: () => Promise<void>;
    isSubmitting?: boolean;
    isAdmin?: boolean;
    isOwner?: boolean;
}

export const EditMemberProfileForm: React.FC<EditMemberProfileFormProps> = ({
    initialData,
    initialAvatarUrl,
    onSubmit,
    onAvatarRemove,
    isSubmitting = false,
    isAdmin = false,
    isOwner = false,
}) => {
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(initialAvatarUrl || null);
    const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<EditProfileFormData>({
        resolver: zodResolver(editProfileSchema),
        defaultValues: initialData,
    });

    useEffect(() => {
        form.reset(initialData);
    }, [initialData, form]);

    const updateAvatarPreview = useCallback(() => {
        setAvatarPreview(initialAvatarUrl || null);
    }, [initialAvatarUrl]);

    useEffect(() => {
            // eslint-disable-next-line react-hooks/set-state-in-effect
        updateAvatarPreview();
    }, [updateAvatarPreview]);

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Пожалуйста, выберите изображение');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Размер изображения не должен превышать 5MB');
            return;
        }

        setAvatarFile(file);
        const preview = URL.createObjectURL(file);
        setAvatarPreview(preview);
    };

    const handleRemoveAvatar = async () => {
        if (onAvatarRemove) {
            setIsRemovingAvatar(true);
            try {
                await onAvatarRemove();
                setAvatarFile(null);
                setAvatarPreview(null);
                toast.success('Аватар удалён');
            } catch (err) {
                // Исправлено: используем err вместо error
                console.error('Error removing avatar:', err);
                toast.error('Ошибка при удалении аватара');
            } finally {
                setIsRemovingAvatar(false);
            }
        }
    };

    const handleSubmit = async (data: EditProfileFormData) => {
        try {
            await onSubmit(data, avatarFile || undefined);
        } catch (err) {
            console.error('Submit error:', err);
            toast.error('Ошибка при сохранении');
        }
    };

    const hasAvatar = avatarPreview && !avatarFile;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center gap-4 pb-4 border-b border-slate-700">
                    <div className="relative">
                        <Avatar className="w-24 h-24 border-2 border-[var(--primary)]">
                            <AvatarImage src={avatarPreview || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white text-2xl">
                                {initialData.first_name?.[0] || initialData.last_name?.[0] || '👤'}
                            </AvatarFallback>
                        </Avatar>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary)]/80 transition-colors"
                        >
                            <CameraIcon className="w-4 h-4" />
                        </button>
                        {hasAvatar && onAvatarRemove && (
                            <button
                                type="button"
                                onClick={handleRemoveAvatar}
                                disabled={isRemovingAvatar}
                                className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                            >
                                {isRemovingAvatar ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <XIcon className="w-3 h-3" />
                                )}
                            </button>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                        />
                    </div>
                    <p className="text-xs text-slate-400">Нажмите на камеру, чтобы загрузить аватар</p>
                </div>

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
                        disabled={isSubmitting || isRemovingAvatar}
                        className="bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-500 hover:to-cyan-500"
                    >
                        {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                    </Button>
                </div>
            </form>
        </Form>
    );
};

export type ProfileUpdateFormData = EditProfileFormData;