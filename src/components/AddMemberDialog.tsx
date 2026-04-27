import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const addMemberSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  relationship: z.enum(['parent', 'child', 'sibling', 'spouse', 'other']),
  birthDate: z.string().optional(),
});

type AddMemberFormData = z.infer<typeof addMemberSchema>;

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddMember: (data: AddMemberFormData) => void;
}

export const AddMemberDialog: React.FC<AddMemberDialogProps> = ({
  open,
  onOpenChange,
  onAddMember,
}) => {
  const form = useForm<AddMemberFormData>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      name: '',
      relationship: 'child',
      birthDate: '',
    },
  });

  const onSubmit = (data: AddMemberFormData) => {
    onAddMember(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900">
        <DialogHeader>
          <DialogTitle className="text-emerald-600 dark:text-emerald-400">
            Добавить члена семьи
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            Введите информацию о новом члене вашей семьи
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Имя</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Введите имя"
                      {...field}
                      className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="relationship"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Родственное отношение</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="parent">Родитель</SelectItem>
                      <SelectItem value="child">Ребенок</SelectItem>
                      <SelectItem value="sibling">Брат/Сестра</SelectItem>
                      <SelectItem value="spouse">Супруг(а)</SelectItem>
                      <SelectItem value="other">Другое</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="birthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Дата рождения (опционально)</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400"
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
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-500 hover:to-cyan-500 text-white"
              >
                Добавить
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};