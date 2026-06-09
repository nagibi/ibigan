import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, LoaderCircle, Plus, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { messageTemplatesService } from '@/services/message-templates.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório.'),
  slug: z.string().min(1, 'Slug é obrigatório.'),
  subject: z.string().min(1, 'Assunto é obrigatório.'),
  body: z.string().min(1, 'Corpo é obrigatório.'),
  merge_tags: z.array(z.string()).nullable(),
  is_active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export function MessageTemplateFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);
  const [tagInput, setTagInput] = useState('');

  const { data: templateData, isLoading } = useQuery({
    queryKey: ['message-template', id],
    queryFn: () => messageTemplatesService.show(Number(id)),
    enabled: isEditing,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      slug: '',
      subject: '',
      body: '',
      merge_tags: [],
      is_active: true,
    },
  });

  useEffect(() => {
    if (templateData?.data.result) {
      const t = templateData.data.result;
      form.reset({
        name: t.name,
        slug: t.slug,
        subject: t.subject,
        body: t.body,
        merge_tags: t.merge_tags ?? [],
        is_active: t.is_active,
      });
    }
  }, [templateData, form]);

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      isEditing
        ? messageTemplatesService.update(Number(id), data)
        : messageTemplatesService.store(
            data as Parameters<typeof messageTemplatesService.store>[0],
          ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
      toast.success(isEditing ? 'Template atualizado!' : 'Template criado!');
      navigate('/message-templates');
    },
    onError: () => toast.error('Erro ao salvar template.'),
  });

  function addTag() {
    const tag = tagInput.trim();
    if (!tag) return;
    const formatted = tag.startsWith('{{') ? tag : `{{${tag}}}`;
    const current = form.getValues('merge_tags') ?? [];
    if (!current.includes(formatted)) {
      form.setValue('merge_tags', [...current, formatted]);
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    const current = form.getValues('merge_tags') ?? [];
    form.setValue(
      'merge_tags',
      current.filter((t) => t !== tag),
    );
  }

  if (isEditing && isLoading) {
    return (
      <div className="container py-6 flex justify-center">
        <LoaderCircle className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          mode="icon"
          size="sm"
          onClick={() => navigate('/message-templates')}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">
            {isEditing ? 'Editar Template' : 'Novo Template'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure o template de mensagem.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((d) => mutation.mutate(d))}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Informações básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Boas-vindas" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="boas-vindas" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Ativo</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assunto</FormLabel>
                    <FormControl>
                      <Input placeholder="Bem-vindo, {{nome}}!" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Corpo da mensagem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conteúdo</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Olá {{nome}}, bem-vindo à {{empresa}}!"
                        className="min-h-[200px] font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Use {'{{variavel}}'} para merge tags.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Merge Tags</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="nome ou {{nome}}"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && (e.preventDefault(), addTag())
                    }
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    <Plus className="size-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 min-h-[32px]">
                  {(form.watch('merge_tags') ?? []).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="font-mono gap-1"
                    >
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)}>
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && (
                <LoaderCircle className="size-4 mr-2 animate-spin" />
              )}
              {isEditing ? 'Salvar alterações' : 'Criar template'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/message-templates')}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
