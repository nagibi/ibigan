import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function GuideSectionCard({
  id,
  icon: Icon,
  title,
  summary,
  children,
  className,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  summary: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-28 rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6',
        className,
      )}
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
        </div>
      </div>
      <div className="space-y-4 text-sm leading-relaxed text-foreground/90">
        {children}
      </div>
    </section>
  );
}

export function GuideBlockTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-semibold text-foreground">{children}</h3>;
}

export function GuideBlockText({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground">{children}</p>;
}

export function GuideBlockList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-muted-foreground marker:text-primary/70">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
