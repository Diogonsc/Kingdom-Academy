import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { NotificationBell } from "@/components/notification-bell";
import { ModeToggle } from "@/components/mode-toggle";

export function AppLayout() {
  const breadcrumbItems = useBreadcrumbs();

  return (
    <TooltipProvider>
      <SidebarProvider className="h-svh overflow-hidden">
        <AppSidebar />
        <SidebarInset className="h-svh min-h-0 overflow-hidden">
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-card transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex min-w-0 flex-1 items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1 shrink-0" />
              <Breadcrumbs items={breadcrumbItems} />
            </div>
            <div className="flex items-center gap-2 px-4">
              <NotificationBell />
              <ModeToggle />
            </div>
          </header>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
