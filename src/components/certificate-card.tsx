import defaultThumbnail from "@/assets/hero.png";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
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
        "group flex h-[320px] w-full max-w-[300px] flex-col gap-0 overflow-hidden p-0",
        "shadow-sm ring-1 ring-border/50 transition-shadow hover:shadow-md dark:ring-foreground/10",
        className,
      )}
      onClick={onView}
    >
      <div className="relative h-40 shrink-0 overflow-hidden">
        <img
          src={certificate.course.thumbnail_url ?? defaultThumbnail}
          alt={certificate.course.title}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-4 flex items-center gap-2 text-white">
          <div className="flex size-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Award className="size-4" />
          </div>
          <span className="text-xs font-medium uppercase tracking-wide">
            Certificado
          </span>
        </div>
      </div>

      <CardHeader className="flex flex-1 flex-col gap-1.5 px-4 py-3">
        <CardTitle className="line-clamp-2 text-sm font-semibold leading-snug">
          {certificate.course.title}
        </CardTitle>
        <CardDescription className="text-xs">
          Emitido em {formattedDate}
        </CardDescription>
        <CardDescription className="line-clamp-2 flex-1 text-xs leading-relaxed">
          Concedido a <span className="font-medium text-foreground">{studentName}</span>
        </CardDescription>
      </CardHeader>

      <CardFooter className="mt-auto shrink-0 border-t bg-muted/20 px-4 py-3">
        <Button
          type="button"
          size="sm"
          className="w-full"
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
