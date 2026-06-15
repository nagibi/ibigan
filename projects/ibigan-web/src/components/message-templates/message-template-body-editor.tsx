import { HtmlEditor } from '@/components/editor/html-editor';
import { isComplexEmailHtml } from '@/lib/is-complex-email-html';
import { Textarea } from '@/components/ui/textarea';

type MessageTemplateBodyEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  isSystemTemplate?: boolean;
  onImageUpload?: (file: File) => Promise<string>;
};

function isLikelyCorruptedSystemBody(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === '' || normalized === '<p></p>' || normalized === '<p><br></p>';
}

export function MessageTemplateBodyEditor({
  value,
  onChange,
  onBlur,
  placeholder,
  disabled = false,
  isSystemTemplate = false,
  onImageUpload,
}: MessageTemplateBodyEditorProps) {
  const useEmailSourceEditor = isComplexEmailHtml(value)
    || (isSystemTemplate && !isLikelyCorruptedSystemBody(value));

  if (useEmailSourceEditor) {
    return (
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        placeholder={placeholder}
        className="min-h-[min(520px,60vh)] resize-y font-mono text-xs leading-relaxed"
      />
    );
  }

  if (isSystemTemplate && isLikelyCorruptedSystemBody(value)) {
    return (
      <div className="space-y-3 rounded-md border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
        <p>
          O conteúdo deste template foi perdido ou corrompido. Sincronize o catálogo da plataforma
          para restaurar o layout padrão do e-mail.
        </p>
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
          className="min-h-32 resize-y font-mono text-xs leading-relaxed"
        />
      </div>
    );
  }

  return (
    <HtmlEditor
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      onImageUpload={onImageUpload}
      disabled={disabled}
    />
  );
}
