"use client"

import { createContext, useContext, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Provides the close-and-refresh callback to forms rendered inside the modal,
// so a form can dismiss the modal and revalidate the page after a successful
// submit without the page having to pass a function across the RSC boundary.
const ModalSuccessContext = createContext<(() => void) | null>(null)

export function useModalSuccess() {
  return useContext(ModalSuccessContext)
}

interface CommonModalProps {
  children: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
}

export function CommonModal({ children, open, onOpenChange, title, description }: CommonModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  )
}

interface ModalButtonProps {
  label?: string
  icon?: React.ReactNode
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  variant?: React.ComponentProps<typeof Button>["variant"]
  size?: React.ComponentProps<typeof Button>["size"]
}

export function ModalButton({
  label,
  icon,
  title,
  description,
  children,
  className,
  variant,
  size,
}: ModalButtonProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const onSuccess = useCallback(() => {
    setOpen(false)
    router.refresh()
  }, [router])

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        aria-label={label ?? title}
        onClick={() => setOpen(true)}
      >
        {icon}
        {label}
      </Button>
      <CommonModal open={open} onOpenChange={setOpen} title={title} description={description}>
        <ModalSuccessContext value={onSuccess}>{children}</ModalSuccessContext>
      </CommonModal>
    </>
  )
}
