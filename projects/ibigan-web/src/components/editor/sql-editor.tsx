import {
  useCallback,
  useMemo,
  useRef,
  type KeyboardEvent,
  type TextareaHTMLAttributes,
} from 'react';
import { highlightSql } from '@/lib/highlight-sql';
import { cn } from '@/lib/utils';
import './sql-editor.css';

export type SqlEditorProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> & {
  value?: string;
  onChange?: (value: string) => void;
  minLines?: number;
};

export function SqlEditor({
  value = '',
  onChange,
  onBlur,
  onScroll,
  disabled,
  placeholder,
  className,
  minLines = 12,
  ...props
}: SqlEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);

  const lineCount = Math.max(minLines, value.split('\n').length || 1);
  const lineNumbers = useMemo(
    () => Array.from({ length: lineCount }, (_, index) => index + 1),
    [lineCount],
  );
  const highlighted = useMemo(() => highlightSql(value || ''), [value]);

  const syncScroll = useCallback(() => {
    if (!textareaRef.current || !highlightRef.current) return;
    highlightRef.current.scrollTop = textareaRef.current.scrollTop;
    highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Tab') return;

    event.preventDefault();
    const textarea = event.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextValue = `${value.slice(0, start)}  ${value.slice(end)}`;

    onChange?.(nextValue);

    requestAnimationFrame(() => {
      textarea.selectionStart = start + 2;
      textarea.selectionEnd = start + 2;
    });
  }, [onChange, value]);

  return (
    <div className={cn('sql-editor', disabled && 'opacity-60', className)}>
      <div className="sql-editor-gutter" aria-hidden="true">
        {lineNumbers.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>

      <div className="sql-editor-body">
        <pre
          ref={highlightRef}
          className="sql-editor-highlight"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: `${highlighted}\n` }}
        />
        <textarea
          ref={textareaRef}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          className="sql-editor-input"
          onChange={(event) => onChange?.(event.target.value)}
          onBlur={onBlur}
          onScroll={(event) => {
            syncScroll();
            onScroll?.(event);
          }}
          onKeyDown={handleKeyDown}
          {...props}
        />
      </div>
    </div>
  );
}
