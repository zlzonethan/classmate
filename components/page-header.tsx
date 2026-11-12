import type { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  action,
}: {
  /** Kept so existing callers still type-check; no longer rendered. */
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        <h1 className="title text-[32px] leading-tight sm:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-prose text-base text-slate-600">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
