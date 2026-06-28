import { cn } from "@/lib/utils";
import type { Book } from "@/types/database";
import { ExternalLink } from "lucide-react";
import { Button } from "../ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";

export function CardBook({ book }: { book: Book }) {
  const { title, description, author, link, image_url } = book;

  function handleClick() {
    if (link) {
      window.open(link, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <Card
      className={cn(
        "group flex max-h-[450px] w-full max-w-[300px] flex-col gap-0 overflow-hidden p-0",
        "shadow-sm ring-1 ring-border/50 transition-shadow",
        "hover:shadow-md dark:ring-foreground/10",
      )}
    >
      <div className="flex h-64 shrink-0 items-center justify-center bg-muted/25 px-4 pt-3 pb-1">
        <img
          src={image_url ?? ""}
          alt={`Capa do livro ${title}`}
          loading="lazy"
          className="h-full w-full object-contain shadow-sm transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>

      <CardHeader className="flex flex-1 flex-col gap-1.5 px-4 py-3">
        <CardTitle className="line-clamp-2 text-sm font-semibold leading-snug">
          {title}
        </CardTitle>
        {author ? (
          <p className="line-clamp-1 text-xs font-medium text-primary/80">
            {author}
          </p>
        ) : null}
        <CardDescription className="line-clamp-3 flex-1 text-xs leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>

      <CardFooter className="mt-auto shrink-0 border-t bg-muted/20 px-4 py-3">
        <Button
          variant="default"
          size="sm"
          className="w-full gap-1.5"
          onClick={handleClick}
        >
          Comprar
          <ExternalLink className="size-3.5 opacity-80" />
        </Button>
      </CardFooter>
    </Card>
  );
}
