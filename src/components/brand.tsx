export function LaneMark({ className = "", large = false }: { className?: string; large?: boolean }) {
  return <svg className={className} width={large ? 48 : 30} height={large ? 48 : 30} viewBox="0 0 32 32" fill="none" aria-hidden="true"><rect width="32" height="32" rx="10" fill="currentColor"/><path d="M10 23V9m0 7c7 0 12-4 12-7m-12 7c7 0 12 4 12 7" stroke="var(--paper)" strokeWidth="2.2" strokeLinecap="round"/><circle cx="10" cy="9" r="2" fill="var(--paper)"/><circle cx="22" cy="9" r="2" fill="var(--paper)"/><circle cx="22" cy="23" r="2" fill="var(--paper)"/></svg>;
}
