import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import * as z from 'zod';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {FileTextIcon, ImageIcon, MusicIcon, VideoIcon} from 'lucide-react';
import type {PostRead, PostType} from '@/types/profile_posts';

const postSchema = z.object({
  title: z.string().max(100, 'Заголовок не должен превышать 100 символов'),
  body: z.string().max(5000, 'Текст не должен превышать 5000 символов'),
  post_type: z.enum(['text', 'photo', 'audio', 'video', 'document']),
  attributed_to_member_id: z.string(),
});

export type PostFormData = z.infer<typeof postSchema>;

interface PostFormProps {
  initialPost?: PostRead;
  familyMembers?: { id: string; display_name: string | null; first_name: string; last_name: string }[];
  onSubmit: (data: PostFormData) => Promise<void>;
  isSubmitting?: boolean;
}

const postTypeIcons: Record<PostType, React.ReactNode> = {
  text: <FileTextIcon className="w-4 h-4" />,
  photo: <ImageIcon className="w-4 h-4" />,
  video: <VideoIcon className="w-4 h-4" />,
  audio: <MusicIcon className="w-4 h-4" />,
  document: <FileTextIcon className="w-4 h-4" />,
};

const postTypeLabels: Record<PostType, string> = {
  text: 'Текст',
  photo: 'Фото',
  video: 'Видео',
  audio: 'Аудио',
  document: 'Документ',
};

export const PostForm: React.FC<PostFormProps> = ({
  initialPost,
  familyMembers,
  onSubmit,
  isSubmitting = false,
}) => {
  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: initialPost?.title ?? '',
      body: initialPost?.body ?? '',
      post_type: initialPost?.post_type ?? 'text',
      attributed_to_member_id: initialPost?.attributed_to_member_id ?? '',
    },
  });

  const handleSubmit = async (data: PostFormData) => {
    await onSubmit(data);
    if (!initialPost) {
      form.reset({
        title: '',
        body: '',
        post_type: 'text',
        attributed_to_member_id: '',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="post_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-300">Тип публикации</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {Object.entries(postTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value} className="text-slate-300">
                      <span className="flex items-center gap-2">
                        {postTypeIcons[value as PostType]}
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

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-300">Заголовок</FormLabel>
              <FormControl>
                <Input
                  placeholder="Заголовок публикации"
                  {...field}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-300">Текст</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Поделитесь историей..."
                  className="resize-none min-h-[150px] bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {familyMembers && familyMembers.length > 0 && (
          <FormField
            control={form.control}
            name="attributed_to_member_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">От имени участника</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="От вашего имени" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="" className="text-slate-300">От вашего имени</SelectItem>
                    {familyMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id} className="text-slate-300">
                        {member.display_name || `${member.first_name} ${member.last_name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex gap-2 justify-end pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-500 hover:to-cyan-500 text-white"
          >
            {isSubmitting
              ? initialPost ? 'Сохранение...' : 'Публикация...'
              : initialPost ? 'Сохранить' : 'Опубликовать'}
          </Button>
        </div>
      </form>
    </Form>
  );
};