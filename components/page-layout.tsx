import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { MoreHorizontalIcon } from "lucide-react"

interface PageLayoutProps {
  title: string
  actions?: React.ReactNode
  children: React.ReactNode
}

export function PageLayout({ title, actions, children }: PageLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">{title}</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {actions && (
            <div className="ml-auto flex items-center gap-2">
              <ButtonGroup className="max-[480px]:hidden">{actions}</ButtonGroup>
              <div className="hidden max-[480px]:flex">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label="Open page actions"
                      />
                    }
                  >
                    <MoreHorizontalIcon />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 [&_[data-slot=button]]:h-8 [&_[data-slot=button]]:w-full [&_[data-slot=button]]:items-center [&_[data-slot=button]]:gap-1.5 [&_[data-slot=button]]:px-2.5 [&_[data-slot=button]]:!justify-center"
                  >
                    <div className="flex flex-col gap-1">{actions}</div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}

        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
