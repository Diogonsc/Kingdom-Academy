"use client";

import * as React from "react";

import { NavMenus } from "@/components/nav-menus";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import logo from "@/assets/logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { usePendingEnrollmentsCount } from "@/hooks/use-pending-enrollments-count";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";
import { navAdmin, navLeader, navMain } from "@/services/navigation";

const teams = [
  {
    name: APP_NAME,
    logo: (
      <img
        src={logo}
        alt={APP_NAME}
        className="size-full object-contain"
      />
    ),
    plan: APP_DESCRIPTION,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const isLeader = profile?.role === "leader";
  const { count: pendingCount } = usePendingEnrollmentsCount(isAdmin);

  const adminBadges: Record<string, number> = {};
  if (pendingCount > 0) {
    adminBadges["/admin/matriculas"] = pendingCount;
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="shrink-0">
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent className="min-h-0 flex-1 overflow-y-auto">
        <NavMenus menus={[...navMain]} groupLabel="Menu" />
        {isAdmin ? (
          <NavMenus
            menus={[...navAdmin]}
            groupLabel="Administração"
            badges={adminBadges}
          />
        ) : null}
        {isLeader ? (
          <NavMenus menus={[...navLeader]} groupLabel="Liderança" />
        ) : null}
      </SidebarContent>
      <SidebarFooter className="shrink-0">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
