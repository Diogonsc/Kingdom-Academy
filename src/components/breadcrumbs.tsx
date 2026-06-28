import { Fragment } from "react";
import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { BreadcrumbItem as BreadcrumbItemType } from "@/types/router";

export function Breadcrumbs({ items }: { items: BreadcrumbItemType[] }) {
  const hasCollapsedItems = items.length > 2;

  return (
    <Breadcrumb className="min-w-0 flex-1 overflow-hidden">
      <BreadcrumbList className="flex-nowrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isCollapsed = hasCollapsedItems && index > 0 && !isLast;

          if (isCollapsed) {
            if (index === 1) {
              return (
                <Fragment key="ellipsis">
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem className="hidden md:flex">
                    <BreadcrumbEllipsis />
                  </BreadcrumbItem>
                </Fragment>
              );
            }

            return null;
          }

          return (
            <Fragment key={item.href}>
              {index > 0 ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem className="min-w-0">
                {isLast ? (
                  <BreadcrumbPage className="max-w-[10rem] truncate sm:max-w-[14rem] md:max-w-none">
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      to={item.href}
                      className="block max-w-[6rem] truncate sm:max-w-[10rem] md:max-w-none"
                    >
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
