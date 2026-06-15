import { useMemo } from 'react';
import {
  applyMessageTemplateMergeData,
  buildDefaultTemplateTagValues,
  extractTemplateTags,
} from '@/lib/message-template-tags';
import { resolveEmailPreviewAssets } from '@/lib/resolve-email-preview-assets';
import { cn } from '@/lib/utils';

type MessageTemplateEmailPreviewProps = {
  subject: string;
  body: string;
  mergeTags?: string[] | null;
  mergeData?: Record<string, string>;
  user?: { name: string; email: string };
  className?: string;
};

function wrapEmailPreviewDocument(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pré-visualização</title>
</head>
<body style="margin:0;padding:0;">
${content}
</body>
</html>`;
}

export function MessageTemplateEmailPreview({
  subject,
  body,
  mergeTags,
  mergeData,
  user = { name: 'Maria Silva', email: 'maria@exemplo.com' },
  className,
}: MessageTemplateEmailPreviewProps) {
  const resolvedMergeData = useMemo(() => {
    const tags = mergeTags?.length
      ? mergeTags.map((tag) => tag.replace(/^\{\{\s*/, '').replace(/\s*\}\}$/, '').trim())
      : extractTemplateTags({ merge_tags: mergeTags ?? null, subject, body });

    return {
      ...buildDefaultTemplateTagValues(tags, user),
      ...mergeData,
    };
  }, [body, mergeData, mergeTags, subject, user]);

  const previewSubject = useMemo(
    () => applyMessageTemplateMergeData(subject, resolvedMergeData),
    [resolvedMergeData, subject],
  );

  const previewHtml = useMemo(() => {
    const merged = applyMessageTemplateMergeData(body, resolvedMergeData);
    return wrapEmailPreviewDocument(resolveEmailPreviewAssets(merged));
  }, [body, resolvedMergeData]);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="rounded-md border border-input bg-muted/30 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Assunto</p>
        <p className="mt-1 text-sm text-foreground">{previewSubject || '—'}</p>
      </div>

      <div className="overflow-hidden rounded-md border border-input bg-[#EEEEEE]">
        <iframe
          title="Pré-visualização do e-mail"
          srcDoc={previewHtml}
          sandbox="allow-same-origin"
          className="block h-[min(720px,70vh)] w-full border-0 bg-[#EEEEEE]"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Pré-visualização com valores de exemplo para as merge tags. O e-mail enviado usará os dados reais do destinatário.
      </p>
    </div>
  );
}
