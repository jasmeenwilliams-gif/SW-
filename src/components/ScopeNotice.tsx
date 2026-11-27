import { Scale } from 'lucide-react';
import { SCOPE_NOTICE_TEXT } from '../data/conciergeData';

export function ScopeNotice() {
  return (
    <aside
      aria-label="Scope of Service and Regulatory Notice"
      className="p-6 lg:p-8 bg-surface-container-lowest rounded border border-brass/35 shadow-[0_4px_20px_-2px_rgba(11,25,44,0.05)] flex flex-col md:flex-row items-start gap-4"
    >
      <div className="w-10 h-10 rounded-full bg-surface-container-low border border-brass/30 flex items-center justify-center shrink-0">
        <Scale className="w-4 h-4 text-secondary" aria-hidden="true" />
      </div>
      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-primary-container text-sm">
            Scope of Service &amp; Regulatory Notice
          </span>
          <span aria-hidden="true" className="text-brass">·</span>
          <span className="font-semibold uppercase tracking-wider text-secondary text-[11px]">
            Strict Compliance Standard
          </span>
        </div>
        <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
          <strong className="text-primary-container font-semibold">
            Strictly Non-Clinical Scope of Service Notice:
          </strong>{' '}
          {SCOPE_NOTICE_TEXT}
        </p>
      </div>
    </aside>
  );
}
