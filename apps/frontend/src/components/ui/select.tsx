import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<React.ComponentProps<'select'>, 'children'> {
  options: SelectOption[]
  placeholder?: string
}

function Select({ className, options, placeholder, ...props }: SelectProps) {
  return (
    <select
      data-slot="select"
      className={cn(
        'flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'dark:border-input dark:bg-input/30',
        className
      )}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

export { Select }
export type { SelectOption }
