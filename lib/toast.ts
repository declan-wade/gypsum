import { toast } from "sonner"

// Position and theming come from the <Toaster /> mounted in the root layout
// (top-center). These helpers just standardise success/error usage.
export function successToast(message: string) {
  toast.success(message)
}

export function errorToast(message: string) {
  toast.error(message)
}
