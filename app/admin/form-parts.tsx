import type * as React from 'react'
import { Field, FieldDescription, FieldError, FieldLabel } from '~/components/ui/field.tsx'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '~/components/ui/select.tsx'
import { Switch } from '~/components/ui/switch.tsx'
import { cn } from '~/lib/utils.ts'

/** A labelled group of form fields inside the scrolling editor body. */
export function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h3 className="font-semibold text-sm">{title}</h3>
      {children}
    </section>
  )
}

export function FieldGrid({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('grid gap-4 sm:grid-cols-2', className)} {...props} />
}

/** `n / max` hint rendered under a text control, matching the original editor. */
export function CharCount({ value, max }: { value: string; max: number }) {
  return <FieldDescription className="self-end tabular-nums">{`${value.length} / ${max}`}</FieldDescription>
}

export function FieldMessage({ error }: { error?: string }) {
  if (!error) return null
  return <FieldError match={true}>{error}</FieldError>
}

/**
 * Nesting `Switch` inside `FieldLabel` is the composition coss styles for: the
 * switch picks up the label's `:active` state through `in-[[data-slot=field-label]:active]`.
 */
export function SwitchField({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <Field className="w-full">
      <FieldLabel className="w-full items-start justify-between gap-4">
        <span className="flex flex-col gap-1">
          <span>{label}</span>
          <FieldDescription render={<span />}>{description}</FieldDescription>
        </span>
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </FieldLabel>
    </Field>
  )
}

export interface SelectOption {
  label: string
  value: string
}

export function SelectField({
  label,
  value,
  onValueChange,
  options,
  className,
}: {
  label: string
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  className?: string
}) {
  return (
    <Field className={cn('w-full', className)}>
      <FieldLabel>{label}</FieldLabel>
      <Select items={options} onValueChange={(next) => onValueChange(String(next))} value={value}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectPopup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
    </Field>
  )
}
