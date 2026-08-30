"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { CHEMISTRY_NAV, TOP_NAV } from "@/lib/nav-config"
import { FlaskConical } from "lucide-react"

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" className="border-slate-800/80">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />} className="press-feedback">
              <div className="flex size-8 items-center justify-center border border-cyan-200/30 bg-cyan-200/10 text-cyan-100 transition-colors duration-200 group-hover:border-cyan-200/50 group-hover:bg-cyan-200/15">
                <FlaskConical className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-mono font-semibold tracking-tight">Academia O1</span>
                <span className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground">SCIENCE LABORATORY</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Subjects</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {TOP_NAV.map((item, index) => (
                <SidebarMenuItem
                  key={item.href}
                  className="reveal reveal-visible"
                  style={{ animationDelay: `${index * 40}ms`, animationDuration: "260ms" }}
                >
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname === item.href}
                    tooltip={item.title}
                    className="relative transition-colors duration-200 active:translate-y-px"
                  >
                    <item.icon className="transition-transform duration-200" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>{CHEMISTRY_NAV.title}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {CHEMISTRY_NAV.items.map((item, index) => (
                <SidebarMenuItem
                  key={item.href}
                  className="reveal reveal-visible"
                  style={{ animationDelay: `${index * 30}ms`, animationDuration: "260ms" }}
                >
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname === item.href}
                    tooltip={item.title}
                    size="sm"
                    className="transition-colors duration-200 active:translate-y-px"
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <p className="px-2 py-1 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          Physics · Chemistry · Biology · History modules live
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}
