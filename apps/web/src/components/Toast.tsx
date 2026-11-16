export default function Toast({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="fixed right-[var(--space-3)] bottom-[var(--space-3)] z-[var(--z-toast)] max-w-[calc(100%-var(--space-4))] rounded-[var(--radius-md)] bg-[var(--color-bg-inverse)] px-[var(--space-3)] py-[var(--space-2)] text-[var(--color-fg-inverse)] shadow-[var(--shadow-md)]"
    >
      {message}
    </div>
  )
}
