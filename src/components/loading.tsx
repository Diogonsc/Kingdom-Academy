import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Loading({
  message = "Carregando...",
  fullPage = true,
}: {
  message?: string;
  fullPage?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-center gap-2 p-4",
        fullPage
          ? "min-h-[calc(100svh-4rem)] flex-1"
          : "py-12",
      )}
    >
      <Loader2 className="size-10 animate-spin text-primary" />
      <p>{message}</p>
    </div>
  );
}
