import defaultThumbnail from "@/assets/hero.png";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CertificateWithCourse } from "@/types/database";
import { Award } from "lucide-react";

type CertificateCardProps = {
  certificate: CertificateWithCourse;
  studentName: string;
  onView: () => void;
  className?: string;
};

export function CertificateCard({
  certificate,
  studentName,
  onView,
  className,
}: CertificateCardProps) {
  const formattedDate = new Date(certificate.issued_at).toLocaleDateString(
    "pt-BR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  );

  return (
    <Card
      className={cn(
        "group flex w-full max-w-[300px] cursor-pointer flex-col gap-0 overflow-hidden p-0",
        "shadow-sm ring-1 ring-border/50 transition-shadow hover:shadow-md dark:ring-foreground/10",
        className,
      )}
      onClick={onView}
    >
      <div className="relative h-36 shrink-0 overflow-hidden">
        <img
          src={certificate.course.thumbnail_url ?? defaultThumbnail}
          alt={certificate.course.title}
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-4 flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-800/80">
            <Award className="size-4 text-white" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wide text-white">
            Certificado
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-4 py-4">
        <CardTitle className="line-clamp-2 text-base font-bold leading-snug">
          {certificate.course.title}
        </CardTitle>
        <CardDescription className="text-sm">
          Emitido em {formattedDate}
        </CardDescription>
        <p className="text-sm leading-relaxed">
          <span className="text-muted-foreground">Concedido a </span>
          <span className="font-semibold text-foreground">{studentName}</span>
        </p>
      </div>

      <CardFooter className="mt-auto shrink-0 border-t px-4 py-3">
        <Button
          type="button"
          className="h-11 w-full font-semibold"
          onClick={(event) => {
            event.stopPropagation();
            onView();
          }}
        >
          Ver Certificado
        </Button>
      </CardFooter>
    </Card>
  );
}
