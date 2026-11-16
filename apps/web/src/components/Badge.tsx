const TONES = {
  success: 'bg-[var(--color-success-subtle)] text-[var(--color-success)]',
  danger: 'bg-[var(--color-danger-subtle)] text-[var(--color-danger)]',
} as const

export default function Badge({ tone, children }: { tone: keyof typeof TONES; children: string }) {
  return (
    <span
      className={`inline-block rounded-[var(--radius-full)] px-[var(--space-2)] text-[length:var(--font-size-sm)] font-[var(--font-weight-medium)] ${TONES[tone]}`}
    >
      {children}
    </span>
  )
}
