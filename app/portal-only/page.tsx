import { redirect } from "next/navigation"
import { ExternalLinkIcon, LockIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getModuleAccess } from "@/lib/rbac"
import { SignOutButton } from "./sign-out-button"

// Landing page for client-portal accounts that sign in to the CRM URL by
// mistake. Their session stays intact (it's shared with the portal project),
// they just can't proceed into the CRM. Staff who land here are bounced home.
export default async function Page() {
  const { user, isPortalClient } = await getModuleAccess()
  if (!user) redirect("/sign-in")
  if (!isPortalClient) redirect("/")

  const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <div className="grid size-14 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
          <LockIcon className="size-6" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            This is the Gypsum team workspace
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Your account is set up for the client portal, so there&apos;s
            nothing for you here. Head to the portal to view your projects,
            quotes and invoices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {portalUrl && (
            <Button nativeButton={false} render={<a href={portalUrl} />}>
              <ExternalLinkIcon />
              Open client portal
            </Button>
          )}
          <SignOutButton />
        </div>
      </div>
    </div>
  )
}
