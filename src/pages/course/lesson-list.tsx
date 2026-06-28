import defaultThumbnail from "@/assets/hero.png";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CourseModule, Lesson } from "@/types/database";
import { CheckCircle2, ChevronDown, ChevronRight, Play } from "lucide-react";
import { useState } from "react";

type LessonListProps = {
  lessons: Lesson[];
  modules: CourseModule[];
  activeLessonId: string;
  onSelectLesson: (lessonId: string) => void;
};

function LessonItem({
  lesson,
  index,
  isActive,
  onSelect,
}: {
  lesson: Lesson;
  index: number;
  isActive: boolean;
  onSelect: () => void;
}) {
  const thumbnail = lesson.thumbnail_url ?? defaultThumbnail;

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onSelect}
      className={cn(
        "group h-auto w-full items-start justify-start gap-3 whitespace-normal rounded-xl border p-3 text-left font-normal",
        isActive
          ? "border-primary/30 bg-primary/5 shadow-sm hover:bg-primary/5"
          : "border-transparent hover:border-border hover:bg-muted/50",
      )}
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted">
        <img
          src={thumbnail}
          alt={lesson.title}
          className="size-full object-cover"
        />
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center transition-colors",
            isActive ? "bg-primary/25" : "bg-black/20 group-hover:bg-black/35",
          )}
        >
          <Play
            className={cn(
              "size-4 fill-current text-white",
              isActive ? "opacity-100" : "opacity-80 group-hover:opacity-100",
            )}
          />
        </div>
        {lesson.duration ? (
          <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-0.5 text-[10px] font-medium text-white">
            {lesson.duration}
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Aula {String(index + 1).padStart(2, "0")}
          </p>
          {lesson.isCompleted ? (
            <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
          ) : null}
        </div>
        <h2
          className={cn(
            "line-clamp-1 text-sm font-semibold",
            isActive ? "text-primary" : "text-foreground",
          )}
        >
          {lesson.title}
        </h2>
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {lesson.description}
        </p>
      </div>
    </Button>
  );
}

function ModuleGroup({
  title,
  lessons,
  globalOffset,
  activeLessonId,
  onSelectLesson,
  defaultOpen = true,
}: {
  title: string;
  lessons: Lesson[];
  globalOffset: number;
  activeLessonId: string;
  onSelectLesson: (lessonId: string) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (lessons.length === 0) return null;

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-semibold hover:bg-muted/50"
      >
        {open ? (
          <ChevronDown className="size-4 shrink-0" />
        ) : (
          <ChevronRight className="size-4 shrink-0" />
        )}
        {title}
        <span className="ml-auto text-xs font-normal text-muted-foreground">
          {lessons.length} aula{lessons.length !== 1 ? "s" : ""}
        </span>
      </button>
      {open ? (
        <div className="space-y-1 pl-1">
          {lessons.map((lesson, index) => (
            <LessonItem
              key={lesson.id}
              lesson={lesson}
              index={globalOffset + index}
              isActive={lesson.id === activeLessonId}
              onSelect={() => onSelectLesson(lesson.id)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function LessonList({
  lessons,
  modules,
  activeLessonId,
  onSelectLesson,
}: LessonListProps) {
  const completedCount = lessons.filter((lesson) => lesson.isCompleted).length;

  const ungrouped = lessons.filter((l) => !l.module_id);
  const grouped = modules.map((mod) => ({
    module: mod,
    lessons: lessons.filter((l) => l.module_id === mod.id),
  }));

  let offset = 0;

  return (
    <aside className="flex w-full flex-col border-t border-border bg-muted/20 px-4 py-4 lg:h-full lg:min-h-0 lg:max-w-[420px] lg:shrink-0 lg:self-stretch lg:border-t-0 lg:border-l">
      <div className="mb-4 flex shrink-0 items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Aulas do curso</h2>
          <p className="text-sm text-muted-foreground">
            {completedCount} de {lessons.length} concluídas
          </p>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {lessons.length} aulas
        </span>
      </div>

      <div className="flex max-h-80 flex-col gap-3 overflow-y-auto pr-1 lg:max-h-none lg:min-h-0 lg:flex-1">
        {modules.length === 0 ? (
          lessons.map((lesson, index) => (
            <LessonItem
              key={lesson.id}
              lesson={lesson}
              index={index}
              isActive={lesson.id === activeLessonId}
              onSelect={() => onSelectLesson(lesson.id)}
            />
          ))
        ) : (
          <>
            {grouped.map(({ module, lessons: moduleLessons }) => {
              const start = offset;
              offset += moduleLessons.length;
              return (
                <ModuleGroup
                  key={module.id}
                  title={module.title}
                  lessons={moduleLessons}
                  globalOffset={start}
                  activeLessonId={activeLessonId}
                  onSelectLesson={onSelectLesson}
                />
              );
            })}
            {ungrouped.length > 0 ? (
              <ModuleGroup
                title="Outras aulas"
                lessons={ungrouped}
                globalOffset={offset}
                activeLessonId={activeLessonId}
                onSelectLesson={onSelectLesson}
              />
            ) : null}
          </>
        )}
      </div>
    </aside>
  );
}
