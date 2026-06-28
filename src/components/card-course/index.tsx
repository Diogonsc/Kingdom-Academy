
import defaultThumbnail from "@/assets/hero.png";
import { ProgressBar } from "@/components/progress-bar";
import { cn } from "@/lib/utils";
import { requestCourseEnrollment, slugifyCourse } from "@/services/courses";
import { CheckIcon, Clock3, Lock, PlayIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { type CardCourseSchema } from "./schema";

type CardCourseProps = {
  course: CardCourseSchema;
  showEnrollmentLock?: boolean;
  onEnrolled?: () => void;
  className?: string;
};

export function CardCourse({
  course,
  showEnrollmentLock = false,
  onEnrolled,
  className,
}: CardCourseProps) {
  const {
    id,
    slug,
    title,
    description,
    thumbnail_url,
    isCompleted,
    requiresEnrollment,
    isEnrolled,
    enrollmentStatus,
    progressPercent = 0,
  } = course;

  const isPending = enrollmentStatus === "pending";
  const isRejected = enrollmentStatus === "rejected";
  const needsEnrollment = requiresEnrollment && !isEnrolled;

  const showProgress =
    isEnrolled && !isCompleted && progressPercent > 0 && !needsEnrollment;
  const isLocked =
    showEnrollmentLock &&
    requiresEnrollment &&
    !isEnrolled &&
    !isCompleted;

  const navigate = useNavigate();
  const [enrolling, setEnrolling] = useState(false);

  function handleClick() {
    if (isLocked || isPending) return;
    navigate(`/curso/${slug ?? slugifyCourse(title)}`);
  }

  async function handleEnroll(event: React.MouseEvent) {
    event.stopPropagation();
    event.preventDefault();

    if (!id) {
      toast.error("Curso inválido. Recarregue a página e tente novamente.");
      return;
    }

    setEnrolling(true);

    try {
      await requestCourseEnrollment(id);
      toast.success("Solicitação enviada! Aguarde aprovação do administrador.");
      onEnrolled?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao solicitar acesso",
      );
    } finally {
      setEnrolling(false);
    }
  }

  function renderActionButton() {
    if (isPending) {
      return (
        <Button
          variant="secondary"
          size="fullwidth"
          className="gap-2 px-4 py-2"
          disabled
        >
          <Clock3 className="size-4" />
          Aguardando aprovação
        </Button>
      );
    }

    if (needsEnrollment) {
      return (
        <Button
          type="button"
          variant="default"
          size="fullwidth"
          className="gap-2 px-4 py-2"
          disabled={enrolling}
          onClick={(event) => void handleEnroll(event)}
        >
          {enrolling
            ? "Solicitando..."
            : isRejected
              ? "Solicitar novamente"
              : "Solicitar Acesso"}
        </Button>
      );
    }

    return (
      <Button
        variant="default"
        size="fullwidth"
        className={cn(
          "gap-2 opacity-100 md:max-h-0 md:overflow-hidden md:opacity-0",
          "transition-all duration-300",
          "md:group-hover:max-h-48 md:group-hover:opacity-100",
          "px-4 py-2",
        )}
        onClick={(event) => {
          event.stopPropagation();
          handleClick();
        }}
      >
        {isCompleted ? (
          <CheckIcon className="size-4" />
        ) : (
          <PlayIcon className="size-4" />
        )}
        {isCompleted ? "Assistir novamente" : "Assistir agora"}
      </Button>
    );
  }

  return (
    <Card
      className={cn(
        "group relative mx-auto h-[320px] w-full max-w-[300px] cursor-pointer overflow-hidden border border-border p-0 sm:h-[360px] lg:h-[400px]",
        className,
      )}
      onClick={handleClick}
    >
      <img
        src={thumbnail_url ?? defaultThumbnail}
        alt={title}
        className="absolute inset-0 size-full object-cover transition-transform duration-500 md:group-hover:scale-105"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

      {isCompleted ? (
        <span className="absolute top-3 right-3 z-10 rounded-full bg-emerald-500/80 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
          Concluído
        </span>
      ) : null}

      {isPending ? (
        <span className="absolute top-3 right-3 z-10 rounded-full bg-amber-500/80 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
          Pendente
        </span>
      ) : null}

      {isLocked ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-20 flex items-center justify-center",
            "opacity-0 transition-opacity duration-300",
            "md:group-hover:opacity-100",
          )}
        >
          <Lock className="size-14 text-white/50 drop-shadow-lg" />
        </div>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 z-10 mb-2 p-4 pb-14">
        <div className="flex flex-col gap-2">
          <h3 className="line-clamp-2 text-base font-semibold text-white">
            {title}
          </h3>
          <p
            className={cn(
              "line-clamp-2 text-sm text-white/85 md:line-clamp-5",
              "max-h-12 opacity-100 md:max-h-0 md:overflow-hidden md:opacity-0",
              "transition-all duration-300",
              "md:group-hover:max-h-48 md:group-hover:opacity-100",
            )}
          >
            {description}
          </p>
        </div>
      </div>
      <div className="absolute bottom-4 left-4 right-4 z-30 space-y-2">
        {showProgress ? (
          <div className="rounded-lg bg-black/50 px-3 py-2 backdrop-blur-sm">
            <div className="mb-1 flex items-center justify-between text-xs text-white/90">
              <span>Progresso</span>
              <span>{progressPercent}%</span>
            </div>
            <ProgressBar value={progressPercent} className="h-1.5 bg-white/20" />
          </div>
        ) : null}
        {renderActionButton()}
      </div>
    </Card>
  );
}
