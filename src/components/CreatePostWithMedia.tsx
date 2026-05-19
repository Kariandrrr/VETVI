import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import * as z from 'zod';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {FileTextIcon, ImageIcon, MusicIcon, VideoIcon} from 'lucide-react';
import {axiosInstance} from '@/api/auth';
import {toast} from 'sonner';
import {TagSelector} from './TagSelector';
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
  familyGroupId: string;
}

const postTypeIcons: Record<string, React.ReactNode> = {
  text: <FileTextIcon className="w-4 h-4" />,
  photo: <ImageIcon className="w-4 h-4" />,
  video: <VideoIcon className="w-4 h-4" />,
  audio: <MusicIcon className="w-4 h-4" />,
  document: <FileTextIcon className="w-4 h-4" />,
};

const postTypeLabels: Record<string, string> = {
  text: 'Текст',
  photo: 'Фото',
  video: 'Видео',
  audio: 'Аудио',
  document: 'Документ',
};

export const CreatePostWithMedia: React.FC<CreatePostWithMediaProps> = ({
  open,
  onOpenChange,
  onPostCreated,
  currentMemberId,
  familyGroupId,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<UUID>>(new Set());

  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      body: '',
      post_type: 'text',
    },
  });

  const handleTagsChange = (tagIds: Set<UUID>) => {
    setSelectedTagIds(tagIds);
  };

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

      const response = await axiosInstance.post('/posts/posts', postData);
      const newPost = response.data;

      if (selectedTagIds.size > 0 && familyGroupId) {
        try {
          await axiosInstance.post(
            `/tags/families/${familyGroupId}/posts/${newPost.id}/tags`,
            Array.from(selectedTagIds)
          );
        } catch (tagError) {
          console.error('Error attaching tags:', tagError);
          toast.warning('Пост создан, но теги не прикрепились');
        }
      }

      form.reset();
      setSelectedTagIds(new Set());
      onPostCreated();
      onOpenChange(false);
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
    setSelectedTagIds(new Set());
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
            {/* Тип публикации */}
            <FormField
              control={form.control}
              name="post_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Тип публикации</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {Object.entries(postTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value} className="text-slate-300">
                          <span className="flex items-center gap-2">
                            {postTypeIcons[value]}
                            {label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            {/* Теги - показываем только если есть familyGroupId */}
            {familyGroupId && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Теги</label>
                <TagSelector
                  familyGroupId={familyGroupId as UUID}
                  initialTags={[]}
                  onTagsChange={handleTagsChange}
                  isEditable={true}
                />
              </div>
            )}

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