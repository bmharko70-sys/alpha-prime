import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { PageMotion, RouteTransitionVeil } from "@/components/science/page-motion"

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex min-h-svh flex-1 flex-col bg-background">
        <SiteHeader />
        <div className="relative flex-1">
          <PageMotion />
          <RouteTransitionVeil />
          <div className="relative z-10">{children}</div>
        </div>
      </div>
    </SidebarProvider>
  )
}
