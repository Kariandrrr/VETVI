import {useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import * as z from 'zod';
import {Button} from '@/components/ui/button';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {Input} from '@/components/ui/input';

const accountSchema = z.object({
    display_name: z.string().min(2, 'Имя должно содержать минимум 2 символа').optional(),
    avatar_url: z.string().optional().nullable(),
});

type AccountFormData = z.infer<typeof accountSchema>;

interface EditAccountFormProps {
    initialData: AccountFormData;
    onSubmit: (data: AccountFormData) => Promise<void>;
    isSubmitting?: boolean;
}

export const EditAccountForm: React.FC<EditAccountFormProps> = ({
    initialData,
    onSubmit,
    isSubmitting = false,
}) => {
    const form = useForm<AccountFormData>({
        resolver: zodResolver(accountSchema),
        defaultValues: {
            display_name: initialData?.display_name || '',
            avatar_url: initialData?.avatar_url || '',
        },
    });

    useEffect(() => {
        form.reset({
            display_name: initialData?.display_name || '',
            avatar_url: initialData?.avatar_url || '',
        });
    }, [initialData, form]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                    placeholder="Как вас называть"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="avatar_url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-slate-300">URL аватара</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    value={field.value || ''}
                                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                                    placeholder="https://example.com/avatar.jpg"
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
                        onClick={() => form.reset({
                            display_name: initialData?.display_name || '',
                            avatar_url: initialData?.avatar_url || '',
                        })}
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