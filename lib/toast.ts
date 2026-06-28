import { toast } from "sonner"
import type React from "react"

const toastStyle = {
  style: { "--border-radius": "calc(var(--radius) + 4px)" } as React.CSSProperties,
  classNames: { content: "flex flex-col gap-2" },
  position: "bottom-right" as const,
}

export function successToast(message: string) {
  toast(message, toastStyle)
}

export function errorToast(message: string) {
  toast.error(message, toastStyle)
}
