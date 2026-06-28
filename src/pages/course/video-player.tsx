import { useEffect, useRef, useState } from "react";
import { LessonNotes } from "@/components/lesson-notes";
import { Button } from "@/components/ui/button";
import { getYoutubeEmbedUrl } from "@/lib/youtube";
import { cn } from "@/lib/utils";
import {
  createYoutubePlayer,
  loadYoutubeIframeApi,
} from "@/lib/youtube-player";
import type { Lesson } from "@/types/database";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
} from "lucide-react";

type VideoPlayerProps = {
  lesson: Lesson;
  lessonIndex: number;
  totalLessons: number;
  onPrevious?: () => void;
  onNext?: () => void;
  onMarkComplete?: () => void;
  onVideoEnded?: () => void;
  autoplay?: boolean;
  hasPrevious?: boolean;
  hasNext?: boolean;
};

export function VideoPlayer({
  lesson,
  lessonIndex,
  totalLessons,
  onPrevious,
  onNext,
  onMarkComplete,
  onVideoEnded,
  autoplay = false,
  hasPrevious = false,
  hasNext = false,
}: VideoPlayerProps) {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const onVideoEndedRef = useRef(onVideoEnded);
  const [useFallbackIframe, setUseFallbackIframe] = useState(false);

  useEffect(() => {
    onVideoEndedRef.current = onVideoEnded;
  }, [onVideoEnded]);

  useEffect(() => {
    setUseFallbackIframe(false);
  }, [lesson.id, lesson.video_id]);

  useEffect(() => {
    if (useFallbackIframe) return;

    const container = playerContainerRef.current;
    if (!container) return;

    let player: ReturnType<typeof createYoutubePlayer> = null;
    let cancelled = false;

    async function setupPlayer() {
      try {
        await loadYoutubeIframeApi();
        if (cancelled || !playerContainerRef.current) return;

        playerContainerRef.current.innerHTML = "";
        player = createYoutubePlayer(
          playerContainerRef.current,
          lesson.video_id,
          {
            autoplay,
            onEnded: () => {
              onVideoEndedRef.current?.();
            },
          },
        );

        if (!player) {
          setUseFallbackIframe(true);
        }
      } catch {
        if (!cancelled) {
          setUseFallbackIframe(true);
        }
      }
    }

    void setupPlayer();

    return () => {
      cancelled = true;
      player?.destroy();
    };
  }, [lesson.id, lesson.video_id, useFallbackIframe]);

  const embedUrl = getYoutubeEmbedUrl(lesson.video_id, autoplay);
  const hasValidVideo = Boolean(embedUrl);

  const lessonNumber = String(lessonIndex + 1).padStart(2, "0");

  return (
    <section className="flex w-full flex-col gap-4">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        {!hasValidVideo ? (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
            Vídeo indisponível para esta aula.
          </div>
        ) : useFallbackIframe && embedUrl ? (
          <iframe
            key={lesson.id}
            src={embedUrl}
            title={lesson.title}
            className="absolute inset-0 z-10 size-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <div ref={playerContainerRef} className="absolute inset-0 size-full" />
        )}
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Aula {lessonNumber} de {totalLessons}
            </p>
            <h2 className="text-base font-semibold leading-snug sm:text-lg">
              {lesson.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {lesson.description}
            </p>
          </div>

          <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:items-end sm:self-stretch sm:justify-between">
            <div className="flex flex-wrap items-center justify-end gap-2">
              {lesson.isCompleted ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5" />
                  Concluída
                </span>
              ) : null}
              {lesson.duration ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  <Clock3 className="size-3.5" />
                  {lesson.duration}
                </span>
              ) : null}
            </div>

            <div className="mt-auto grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
              {!lesson.isCompleted && onMarkComplete ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={onMarkComplete}
                  className="col-span-2 gap-1 sm:col-span-1"
                >
                  <CheckCircle2 className="size-4" />
                  Marcar como concluída
                </Button>
              ) : null}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onPrevious}
                disabled={!hasPrevious}
                className="gap-1"
              >
                <ChevronLeft className="size-4" />
                Anterior
              </Button>

              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={onNext}
                disabled={!hasNext}
                className={cn("gap-1", !hasNext && "opacity-50")}
              >
                Próxima
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <LessonNotes lessonId={lesson.id} />
    </section>
  );
}
