import { useLocation, useMatches } from "react-router-dom";
import { navMain } from "@/services/navigation";
import type { BreadcrumbItem, RouteHandle } from "@/types/router";

export function useBreadcrumbs(): BreadcrumbItem[] {
  const location = useLocation();
  const matches = useMatches();

  const customBreadcrumbs = [...matches]
    .reverse()
    .find(
      (match) =>
        typeof (match.handle as RouteHandle | undefined)?.breadcrumbs ===
        "function",
    );

  if (customBreadcrumbs) {
    return (customBreadcrumbs.handle as RouteHandle).breadcrumbs!(
      customBreadcrumbs,
    );
  }

  const handleBreadcrumbs = matches
    .map((match) => {
      const breadcrumb = (match.handle as RouteHandle | undefined)?.breadcrumb;

      if (!breadcrumb) return null;

      const label =
        typeof breadcrumb === "function" ? breadcrumb(match) : breadcrumb;

      return { label, href: match.pathname };
    })
    .filter((item): item is BreadcrumbItem => item !== null);

  if (handleBreadcrumbs.length > 0) {
    return handleBreadcrumbs;
  }

  const currentItem = navMain.find((item) => item.url === location.pathname);

  if (currentItem) {
    return [{ label: currentItem.name, href: currentItem.url }];
  }

  return [{ label: "Página Inicial", href: "/" }];
}
