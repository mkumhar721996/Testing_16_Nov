export function SectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-[var(--space-3)] rounded-[var(--radius-lg)] border-[length:var(--border-width)] border-[color:var(--color-danger)] bg-[color:var(--color-danger-subtle)] p-[var(--space-4)] text-[color:var(--color-fg)]"
    >
      <p>We couldn’t load the indices. Please try again.</p>
      <button
        type="button"
        onClick={onRetry}
        className="min-h-[var(--tap-target)] rounded-[var(--radius-md)] bg-[color:var(--color-primary)] px-[var(--space-4)] font-[var(--font-weight-medium)] text-[color:var(--color-bg)] focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-[color:var(--color-focus)]"
      >
        Try again
      </button>
    </div>
  )
}
