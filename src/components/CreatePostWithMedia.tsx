import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import * as z from 'zod';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {axiosInstance} from '@/api/auth';
import {toast} from 'sonner';
import type {UUID} from '@/types/common';
import type {AxiosError} from 'axios';
import {useState} from "react";

const postSchema = z.object({
  title: z.string().max(100, 'Заголовок не должен превышать 100 символов').optional(),
  body: z.string().max(5000, 'Текст не должен превышать 5000 символов').optional(),
  post_type: z.enum(['text', 'photo', 'audio', 'video', 'document']),
});

type PostFormData = z.infer<typeof postSchema>;

interface CreatePostWithMediaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated: () => void;
  currentMemberId?: UUID | null;
}

export const CreatePostWithMedia: React.FC<CreatePostWithMediaProps> = ({
  open,
  onOpenChange,
  onPostCreated,
  currentMemberId,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      body: '',
      post_type: 'text',
    },
  });

  const handleSubmit = async (data: PostFormData) => {
    setIsSubmitting(true);

    try {
      const postData: Record<string, unknown> = {};

      if (data.title && data.title.trim()) {
        postData.title = data.title.trim();
      }
      if (data.body && data.body.trim()) {
        postData.body = data.body.trim();
      }
      postData.post_type = data.post_type;
      if (currentMemberId) {
        postData.attributed_to_member_id = currentMemberId;
      }

      await axiosInstance.post('/posts/posts', postData);

      form.reset();

      onOpenChange(false);

      onPostCreated();

      toast.success('Пост опубликован!');
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Create post error:', axiosError.response?.data);
      toast.error('Ошибка при создании поста');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Новая публикация</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">


            {/* Заголовок */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Заголовок</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Заголовок публикации (необязательно)"
                      {...field}
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Текст */}
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Текст</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Поделитесь историей... (необязательно)"
                      className="resize-none min-h-[150px] bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Кнопки */}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="bg-slate-800 border-slate-700 text-slate-300"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-500 hover:to-cyan-500 text-white"
              >
                {isSubmitting ? 'Публикация...' : 'Опубликовать'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};