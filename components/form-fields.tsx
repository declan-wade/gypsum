"use client"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FieldApi = import("@tanstack/react-form").FieldApi<any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any>
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function useFieldMeta(field: FieldApi) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  return { isInvalid }
}

interface TextFieldProps {
  field: FieldApi
  label: string
  placeholder?: string
  type?: string
}

export function FormTextField({ field, label, placeholder, type = "text" }: TextFieldProps) {
  const { isInvalid } = useFieldMeta(field)
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        type={type}
        value={field.state.value as string}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
        placeholder={placeholder}
        autoComplete="off"
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}

interface NumberFieldProps {
  field: FieldApi
  label: string
  placeholder?: string
  step?: string
}

export function FormNumberField({ field, label, placeholder, step = "any" }: NumberFieldProps) {
  const { isInvalid } = useFieldMeta(field)
  // iOS Safari drops typed characters in `type="number"` inputs, so use a text
  // input with a numeric keypad hint instead. Whole-number fields (step="1")
  // get the integer keypad; everything else keeps the decimal keypad.
  const isInteger = step === "1"
  const inputMode = isInteger ? "numeric" : "decimal"
  const pattern = isInteger ? "[0-9]*" : "[0-9]*[.,]?[0-9]*"
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        type="text"
        inputMode={inputMode}
        pattern={pattern}
        value={field.state.value as string}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
        placeholder={placeholder}
        autoComplete="off"
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}

export function FormDateField({ field, label }: { field: FieldApi; label: string }) {
  const { isInvalid } = useFieldMeta(field)
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        type="date"
        value={field.state.value as string}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}

interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps {
  field: FieldApi
  label: string
  placeholder?: string
  options: SelectOption[]
  onValueChange?: (value: string) => void
}

export function FormSelectField({ field, label, placeholder, options, onValueChange }: SelectFieldProps) {
  const { isInvalid } = useFieldMeta(field)
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Select
        items={options}
        value={field.state.value as string}
        onValueChange={(value) => {
          field.handleChange(value ?? "")
          onValueChange?.(value ?? "")
        }}
      >
        <SelectTrigger
          id={field.name}
          onBlur={field.handleBlur}
          aria-invalid={isInvalid}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}

interface SwitchFieldProps {
  field: FieldApi
  label: string
  description?: string
}

export function FormSwitchField({ field, label, description }: SwitchFieldProps) {
  return (
    <Field orientation="horizontal">
      <FieldContent>
        <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
      </FieldContent>
      <Switch
        id={field.name}
        name={field.name}
        checked={field.state.value as boolean}
        onCheckedChange={(checked) => field.handleChange(checked)}
        onBlur={field.handleBlur}
      />
    </Field>
  )
}

export function FormActions() {
  return (
    <Field orientation="horizontal" className="mt-6">
      <Button type="submit">Submit</Button>
    </Field>
  )
}
