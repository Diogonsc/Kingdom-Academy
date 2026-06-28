import defaultThumbnail from "@/assets/hero.png";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { StudentExamItem } from "@/types/exam";
import {
  ArrowRight,
  Clock3,
  FileQuestion,
  PlayIcon,
  RotateCcw,
  XCircle,
} from "lucide-react";

type ExamCardProps = {
  exam: StudentExamItem;
  onOpen: () => void;
  className?: string;
};

function getStatusConfig(exam: StudentExamItem) {
  const { attempt } = exam;

  if (!attempt) {
    return {
      label: "Não iniciada",
      variant: "outline" as const,
      icon: FileQuestion,
      accent: "border-l-primary",
    };
  }

  if (attempt.status === "in_progress") {
    return {
      label: "Em andamento",
      variant: "default" as const,
      icon: PlayIcon,
      accent: "border-l-amber-500",
      badgeClass:
        "bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300",
    };
  }

  if (attempt.status === "submitted") {
    return {
      label: "Aguardando correção",
      variant: "secondary" as const,
      icon: Clock3,
      accent: "border-l-muted-foreground/40",
    };
  }

  if (attempt.status === "graded" && attempt.passed) {
    return {
      accent: "border-l-emerald-500",
    };
  }

  if (attempt.status === "graded" && exam.canStartNew) {
    return {
      label: "Reprovada",
      variant: "destructive" as const,
      icon: RotateCcw,
      accent: "border-l-destructive",
    };
  }

  return {
    label: "Tentativas esgotadas",
    variant: "destructive" as const,
    icon: XCircle,
    accent: "border-l-destructive",
  };
}

function getActionLabel(exam: StudentExamItem) {
  if (!exam.attempt) return "Iniciar";
  if (exam.attempt.status === "in_progress") return "Continuar";
  if (exam.attempt.status === "submitted") return "Ver status";
  if (exam.canStartNew) return "Tentar novamente";
  return "Ver resultado";
}

function ExamScore({ exam }: { exam: StudentExamItem }) {
  const score = exam.attempt?.final_score;
  const passed = exam.attempt?.passed;

  if (score === null || score === undefined) return null;

  const approved = passed === true;

  return (
    <Badge
      variant={approved ? "default" : "destructive"}
      className={cn(
        "text-xs",
        approved && "bg-emerald-600 text-white hover:bg-emerald-600",
      )}
    >
      {score.toFixed(1)} · {approved ? "Aprovado" : "Reprovado"}
    </Badge>
  );
}

export function ExamCard({ exam, onOpen, className }: ExamCardProps) {
  const status = getStatusConfig(exam);
  const StatusIcon = status.icon;
  const isGraded = exam.attempt?.status === "graded";
  const showScore = isGraded && exam.attempt?.final_score !== null;
  const showStatusBadge = !showScore && status.label;

  return (
    <Card
      className={cn(
        "group w-fit cursor-pointer overflow-hidden border-l-4 p-0 transition-all hover:shadow-md",
        status.accent,
        className,
      )}
      onClick={onOpen}
    >
      <div className="flex items-stretch">
        <div className="w-24 shrink-0 overflow-hidden sm:w-28">
          <img
            src={exam.course.thumbnail_url ?? defaultThumbnail}
            alt={exam.course.title}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex max-w-[240px] flex-col justify-center gap-2.5 p-3.5">
          {showStatusBadge ? (
            <Badge
              variant={status.variant}
              className={cn("w-fit gap-1 text-xs font-normal", status.badgeClass)}
            >
              {StatusIcon ? <StatusIcon className="size-3" /> : null}
              {status.label}
            </Badge>
          ) : null}

          <div>
            <h3 className="line-clamp-1 text-sm font-semibold">{exam.title}</h3>
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {exam.course.title}
            </p>
          </div>

          {showScore ? (
            <div onClick={(event) => event.stopPropagation()}>
              <ExamScore exam={exam} />
            </div>
          ) : null}

          <Button
            size="sm"
            variant={!exam.attempt ? "default" : "outline"}
            className="w-fit gap-1.5"
            onClick={(event) => {
              event.stopPropagation();
              onOpen();
            }}
          >
            {getActionLabel(exam)}
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
