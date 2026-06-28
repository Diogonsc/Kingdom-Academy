import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ScoreBadgeProps = {
  score: number | null;
  passed: boolean | null;
  passingScore: number;
  className?: string;
};

export function ScoreBadge({
  score,
  passed,
  passingScore,
  className,
}: ScoreBadgeProps) {
  if (score === null) {
    return (
      <Badge variant="secondary" className={className}>
        Aguardando correção
      </Badge>
    );
  }

  const approved = passed === true;

  return (
    <Badge
      variant={approved ? "default" : "destructive"}
      className={cn(
        approved && "bg-emerald-600 text-white hover:bg-emerald-600",
        className,
      )}
    >
      Nota: {score.toFixed(1)} / 100 — {approved ? "Aprovado" : "Reprovado"} (mín.{" "}
      {passingScore})
    </Badge>
  );
}
