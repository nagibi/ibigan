import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type ContainerProps = HTMLAttributes<HTMLDivElement>;

export function Container({ className, children, ...props }: ContainerProps) {
  return (
    <div className={cn('container-fluid w-full max-w-none', className)} {...props}>
      {children}
    </div>
  );
}
