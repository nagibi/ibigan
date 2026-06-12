import {
  createContext,
  useContext,
  useRef,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from 'react';
import { cn } from '@/lib/utils';

const PageScrollContext = createContext<RefObject<HTMLElement | null> | null>(null);

export function PageScrollProvider({ children }: { children: ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <PageScrollContext.Provider value={scrollRef}>
      {children}
    </PageScrollContext.Provider>
  );
}

export function PageScrollContainer({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const scrollRef = usePageScrollRef();

  return (
    <div
      ref={scrollRef as RefObject<HTMLDivElement>}
      className={cn(className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function usePageScrollRef() {
  return useContext(PageScrollContext);
}
