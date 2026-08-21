import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex min-h-svh flex-1 flex-col bg-background">
        <SiteHeader />
        <div className="relative flex-1">{children}</div>
      </div>
    </SidebarProvider>
  )
}
