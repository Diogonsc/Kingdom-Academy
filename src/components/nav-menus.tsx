import { Link, useLocation } from "react-router-dom";
import { type LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavMenus({
  menus,
  groupLabel = "Menu",
  badges = {},
}: {
  menus: {
    name: string;
    url: string;
    icon: LucideIcon;
    activePaths?: readonly string[];
  }[];
  groupLabel?: string;
  badges?: Record<string, number>;
}) {
  const location = useLocation();

  function isNavItemActive(item: (typeof menus)[number]) {
    const { pathname } = location;

    if (item.url === "/dashboard") {
      return pathname === "/dashboard";
    }

    if (pathname.startsWith(item.url)) {
      return true;
    }

    return item.activePaths?.some((path) => pathname.startsWith(path)) ?? false;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>
      <SidebarMenu>
        {menus.map((item) => {
          const isActive = isNavItemActive(item);
          const badgeCount = badges[item.url] ?? 0;

          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild tooltip={item.name} isActive={isActive}>
                <Link to={item.url}>
                  <item.icon />
                  <span>{item.name}</span>
                  {badgeCount > 0 ? (
                    <SidebarMenuBadge className="bg-destructive text-destructive-foreground">
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </SidebarMenuBadge>
                  ) : null}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
