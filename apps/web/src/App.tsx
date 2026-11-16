import { IndicesSection } from './indices/IndicesSection'

export default function App() {
  return (
    <main className="mx-auto flex max-w-[var(--content-max-width)] flex-col gap-[var(--space-4)] bg-[color:var(--color-bg)] p-[var(--space-4)]">
      <h1 className="text-[length:var(--font-size-lg)] font-[var(--font-weight-medium)] text-[color:var(--color-fg)]">
        Dashboard
      </h1>
      <IndicesSection />
    </main>
  )
}
