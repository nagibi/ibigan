import { useCallback, useEffect, useRef, useState, type ElementType } from 'react';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  LoaderCircle,
  Redo2,
  Strikethrough,
  Type,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import './html-editor.css';

export type HtmlEditorProps = {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onImageUpload?: (file: File) => Promise<string>;
};

function ToolbarButton({
  label,
  icon: Icon,
  active,
  disabled,
  onClick,
}: {
  label: string;
  icon: ElementType;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size="sm"
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      title={label}
      className="size-8 shrink-0 p-0"
    >
      <Icon className="size-4" />
    </Button>
  );
}

export function HtmlEditor({
  value = '',
  onChange,
  onBlur,
  placeholder = 'Digite o conteúdo...',
  disabled = false,
  className,
  onImageUpload,
}: HtmlEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const lastEmittedValue = useRef(value);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [viewMode, setViewMode] = useState<'visual' | 'html'>('visual');
  const [sourceHtml, setSourceHtml] = useState(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image.configure({ allowBase64: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();
      lastEmittedValue.current = html;
      onChange?.(html);
    },
    onBlur: () => onBlur?.(),
    editorProps: {
      attributes: {
        class: 'text-sm leading-relaxed text-foreground',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor) return;
    if (value === lastEmittedValue.current) return;

    if (viewMode === 'html') {
      setSourceHtml(value);
      lastEmittedValue.current = value;
      return;
    }

    const currentHtml = editor.getHTML();
    if (value !== currentHtml) {
      editor.commands.setContent(value || '', { emitUpdate: false });
      lastEmittedValue.current = value;
      setSourceHtml(value);
    }
  }, [editor, value, viewMode]);

  const switchToHtml = useCallback(() => {
    if (!editor) return;
    const html = editor.getHTML();
    setSourceHtml(html);
    lastEmittedValue.current = html;
    setViewMode('html');
  }, [editor]);

  const switchToVisual = useCallback(() => {
    if (!editor) return;
    editor.commands.setContent(sourceHtml || '', { emitUpdate: false });
    lastEmittedValue.current = sourceHtml;
    onChange?.(sourceHtml);
    setViewMode('visual');
  }, [editor, onChange, sourceHtml]);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL do link', previousUrl ?? 'https://');

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor || !onImageUpload) return;

    setIsUploadingImage(true);
    try {
      const url = await onImageUpload(file);
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  }, [editor, onImageUpload]);

  if (!editor) {
    return (
      <div className={cn('html-editor flex min-h-[280px] items-center justify-center rounded-md border border-input bg-background', className)}>
        <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'html-editor overflow-hidden rounded-md border border-input bg-background shadow-xs',
        disabled && 'opacity-60 pointer-events-none',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-input bg-muted/30 px-2 py-1.5">
        {viewMode === 'visual' && (
          <>
        <ToolbarButton
          label="Negrito"
          icon={Bold}
          active={editor.isActive('bold')}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          label="Itálico"
          icon={Italic}
          active={editor.isActive('italic')}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          label="Sublinhado"
          icon={UnderlineIcon}
          active={editor.isActive('underline')}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <ToolbarButton
          label="Tachado"
          icon={Strikethrough}
          active={editor.isActive('strike')}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />

        <span className="mx-1 h-5 w-px bg-border" />

        <ToolbarButton
          label="Lista"
          icon={List}
          active={editor.isActive('bulletList')}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          label="Lista numerada"
          icon={ListOrdered}
          active={editor.isActive('orderedList')}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />

        <span className="mx-1 h-5 w-px bg-border" />

        <ToolbarButton
          label="Alinhar à esquerda"
          icon={AlignLeft}
          active={editor.isActive({ textAlign: 'left' })}
          disabled={disabled}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        />
        <ToolbarButton
          label="Centralizar"
          icon={AlignCenter}
          active={editor.isActive({ textAlign: 'center' })}
          disabled={disabled}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        />
        <ToolbarButton
          label="Alinhar à direita"
          icon={AlignRight}
          active={editor.isActive({ textAlign: 'right' })}
          disabled={disabled}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        />

        <span className="mx-1 h-5 w-px bg-border" />

        <ToolbarButton
          label="Link"
          icon={Link2}
          active={editor.isActive('link')}
          disabled={disabled}
          onClick={setLink}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          title="Inserir imagem"
          disabled={disabled || isUploadingImage || !onImageUpload}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => imageInputRef.current?.click()}
          className="size-8 shrink-0 p-0"
        >
          {isUploadingImage
            ? <LoaderCircle className="size-4 animate-spin" />
            : <ImageIcon className="size-4" />
          }
        </Button>

        <span className="mx-1 h-5 w-px bg-border" />

        <ToolbarButton
          label="Desfazer"
          icon={Undo2}
          disabled={disabled || !editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        />
        <ToolbarButton
          label="Refazer"
          icon={Redo2}
          disabled={disabled || !editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        />
          </>
        )}

        <div className="ms-auto flex items-center gap-0.5">
          <ToolbarButton
            label="Editor visual"
            icon={Type}
            active={viewMode === 'visual'}
            disabled={disabled}
            onClick={() => {
              if (viewMode === 'html') switchToVisual();
            }}
          />
          <ToolbarButton
            label="Código HTML"
            icon={Code2}
            active={viewMode === 'html'}
            disabled={disabled}
            onClick={() => {
              if (viewMode === 'visual') switchToHtml();
            }}
          />
        </div>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleImageUpload(file);
        }}
      />

      {viewMode === 'visual' ? (
        <EditorContent editor={editor} />
      ) : (
        <Textarea
          value={sourceHtml}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => {
            const html = event.target.value;
            setSourceHtml(html);
            lastEmittedValue.current = html;
            onChange?.(html);
          }}
          onBlur={onBlur}
          className="html-editor-source min-h-[220px] resize-y rounded-none border-0 font-mono text-xs shadow-none focus-visible:ring-0"
        />
      )}
    </div>
  );
}
