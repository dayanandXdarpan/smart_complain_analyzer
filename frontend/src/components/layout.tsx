import { type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

type OrbSpec = {
  className: string;
  style?: CSSProperties;
};

export function PageShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`page-shell ${className}`}>{children}</div>;
}

export function BackgroundOrbs({ orbs }: { orbs: OrbSpec[] }) {
  return (
    <>
      {orbs.map((orb, index) => (
        <div key={`${orb.className}-${index}`} aria-hidden className={`floating-orb ${orb.className}`} style={orb.style} />
      ))}
    </>
  );
}

export function BrandMark({ compact = false, className = '' }: { compact?: boolean; className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="brand-mark">
        <FileText className="h-[18px] w-[18px] text-on-primary" />
      </div>
      {!compact && <span className="text-headline-sm font-headline-sm tracking-tighter text-on-surface">ComplainHUB</span>}
    </div>
  );
}

export function SurfaceCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`surface-card w-full ${className}`}>{children}</div>;
}

export function PageHeader({
  title,
  description,
  backHref,
  actions,
  showBrand = false,
  className = '',
}: {
  title: string;
  description?: string;
  backHref?: string;
  actions?: ReactNode;
  showBrand?: boolean;
  className?: string;
}) {
  return (
    <header className={`flex items-start gap-3 sm:gap-4 ${className}`}>
      {backHref ? (
        <Link to={backHref} aria-label="Go back" className="icon-button shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      ) : null}
      <div className="min-w-0 flex-1">
        {showBrand ? <BrandMark className="mb-3" /> : null}
        <h1 className="text-headline-md font-headline-md tracking-tighter text-on-surface leading-none">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm text-on-surface-variant">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}