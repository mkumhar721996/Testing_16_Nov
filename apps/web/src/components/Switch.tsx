interface SwitchProps {
  label: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}

const track =
  'relative m-0 flex-none cursor-pointer appearance-none rounded-[var(--radius-full)] bg-[var(--color-border-strong)] checked:bg-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50 w-[var(--switch-width)] h-[var(--switch-height)]'
const focus =
  'focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-[var(--color-focus)] focus-visible:outline-offset-[var(--focus-ring-width)]'
const thumb =
  "after:absolute after:top-[var(--space-1)] after:left-[var(--space-1)] after:size-[calc(var(--switch-height)-var(--space-2))] after:rounded-[var(--radius-full)] after:bg-[var(--color-bg)] after:content-[''] checked:after:left-[calc(var(--switch-width)-var(--switch-height)+var(--space-1))]"

export default function Switch({ label, checked, disabled, onChange }: SwitchProps) {
  return (
    <input
      type="checkbox"
      role="switch"
      aria-label={label}
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      className={`${track} ${focus} ${thumb}`}
    />
  )
}
