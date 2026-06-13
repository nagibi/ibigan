import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { FormStatusBadge } from './form-record-identifier';

export function FormPanel({
  title,
  description,
  isActive,
  children,
  className,
}: {
  title?: string;
  description?: string;
  isActive?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('mb-4', className)}>
      {title && (
        <CardHeader className="min-h-0 px-4 py-3 max-xl:px-4 max-xl:py-4">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base leading-snug">{title}</CardTitle>
            {isActive !== undefined && <FormStatusBadge isActive={isActive} />}
          </div>
          {description && (
            <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
          )}
        </CardHeader>
      )}
      <CardContent className={cn('max-xl:px-4 max-xl:pb-4', title ? 'max-xl:pt-5' : 'pt-5')}>
        {children}
      </CardContent>
    </Card>
  );
}
