import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import { cn } from '@/lib/utils'

interface SegmentedControlProps<T extends string> {
  value: T
  onValueChange: (value: T) => void
  options: { value: T; label: string }[]
  /** accessible name for the group, e.g. "Chart metric" */
  label: string
  className?: string
}

/**
 * shadcn/ui ToggleGroup styled as a segmented control.
 * Use for filters / chart switches that don't own a content panel
 * (Radix Tabs require matching TabsContent for valid ARIA).
 * Arrow keys move between options; one option is always selected.
 */
export function SegmentedControl<T extends string>({ value, onValueChange, options, label, className }: SegmentedControlProps<T>) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      onValueChange={(v) => v && onValueChange(v as T)}
      aria-label={label}
      className={cn('inline-flex h-9 max-w-full items-center overflow-x-auto rounded-xl bg-surface-muted p-1 no-scrollbar', className)}
    >
      {options.map((o) => (
        <ToggleGroupPrimitive.Item
          key={o.value}
          value={o.value}
          className="inline-flex h-7 shrink-0 items-center justify-center whitespace-nowrap rounded-lg px-3 text-xs font-semibold text-ink/65 transition-all hover:text-ink data-[state=on]:bg-white data-[state=on]:text-ink data-[state=on]:shadow-sm"
        >
          {o.label}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  )
}
