import type { UIMatch } from "react-router-dom";

export type BreadcrumbItem = {
  label: string;
  href: string;
};

export type RouteHandle = {
  breadcrumb?: string | ((match: UIMatch) => string);
  breadcrumbs?: (match: UIMatch) => BreadcrumbItem[];
};
