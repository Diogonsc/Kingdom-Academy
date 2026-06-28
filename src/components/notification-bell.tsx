import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/use-notifications";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notifications";

export function NotificationBell() {
  const { notifications, unreadCount, refetch } = useNotifications();

  async function handleOpenChange(open: boolean) {
    if (open) {
      await refetch();
    }
  }

  async function handleClick(id: string, link: string | null) {
    await markNotificationRead(id);
    await refetch();
    if (link) {
      window.location.href = link;
    }
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    await refetch();
  }

  return (
    <DropdownMenu onOpenChange={(open) => void handleOpenChange(open)}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-4" />
          {unreadCount > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notificações
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => void handleMarkAllRead()}
              className="text-xs font-normal text-primary hover:underline"
            >
              Marcar todas como lidas
            </button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            Nenhuma notificação
          </p>
        ) : (
          notifications.slice(0, 8).map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="flex cursor-pointer flex-col items-start gap-0.5 py-2"
              onClick={() =>
                void handleClick(notification.id, notification.link)
              }
            >
              <span
                className={
                  notification.is_read
                    ? "text-sm font-medium"
                    : "text-sm font-semibold"
                }
              >
                {notification.title}
              </span>
              <span className="line-clamp-2 text-xs text-muted-foreground">
                {notification.message}
              </span>
            </DropdownMenuItem>
          ))
        )}
        {notifications.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/dashboard" className="w-full text-center text-xs">
                Ver todas no dashboard
              </Link>
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
