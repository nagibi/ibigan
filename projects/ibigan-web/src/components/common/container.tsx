import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type ContainerProps = HTMLAttributes<HTMLDivElement>;

export function Container({ className, children, ...props }: ContainerProps) {
  return (
    <div className={cn('container', className)} {...props}>
      {children}
    </div>
  );
}
