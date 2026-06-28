import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function ModeToggle() {
  const { setTheme } = useTheme();

  function toggleTheme() {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className="relative"
      onClick={toggleTheme}
    >
      <Sun
        className={cn(
          "size-[1.2rem] scale-100 rotate-0 text-amber-500 transition-all",
          "dark:scale-0 dark:-rotate-90 dark:text-amber-500",
        )}
      />
      <Moon
        className={cn(
          "absolute size-[1.2rem] scale-0 rotate-90 text-sky-200 transition-all",
          "dark:scale-100 dark:rotate-0 dark:text-sky-100",
        )}
      />
      <span className="sr-only">Alternar tema</span>
    </Button>
  );
}
