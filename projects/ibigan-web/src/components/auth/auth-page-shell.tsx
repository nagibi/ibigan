import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { toAbsoluteUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';

type AuthPageShellProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function AuthPageShell({
  children,
  className,
  contentClassName,
}: AuthPageShellProps) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, []);

  return createPortal(
    <>
      <style>{`
        .auth-bg {
          background-image: url('${toAbsoluteUrl('/media/images/2600x1200/bg-10.png')}');
        }
        .dark .auth-bg {
          background-image: url('${toAbsoluteUrl('/media/images/2600x1200/bg-10-dark.png')}');
        }
        .auth-page-shell {
          position: fixed;
          inset: 0;
          z-index: 50;
          height: 100dvh;
          overflow: hidden;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
        .auth-page-shell-scroll {
          height: 100%;
          overflow-x: hidden;
          overflow-y: auto;
          overscroll-behavior-y: contain;
          -webkit-overflow-scrolling: touch;
        }
        .auth-page-shell-stage {
          display: flex;
          flex-direction: column;
          align-items: center;
          box-sizing: border-box;
          min-height: 100%;
          padding:
            max(0.75rem, env(safe-area-inset-top, 0px))
            1rem
            max(1.25rem, env(safe-area-inset-bottom, 0px));
        }
        .auth-page-shell-content {
          display: flex;
          width: 100%;
          max-width: 420px;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          margin-block: auto;
          flex-shrink: 0;
        }
      `}</style>

      <div className={cn('auth-bg auth-page-shell', className)}>
        <div className="auth-page-shell-scroll">
          <div className="auth-page-shell-stage">
            <div className={cn('auth-page-shell-content', contentClassName)}>
              <Link to="/" className="shrink-0">
                <img
                  src={toAbsoluteUrl('/media/app/mini-logo.svg')}
                  className="h-[35px] max-w-none max-xl:h-[30px]"
                  alt="Ibigan"
                />
              </Link>
              {children}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
