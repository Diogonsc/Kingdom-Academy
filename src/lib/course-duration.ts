type LessonDuration = {
  duration: string | null;
};

function parseDurationToMinutes(duration: string): number {
  const parts = duration
    .trim()
    .split(":")
    .map((part) => Number(part));

  if (parts.some((part) => Number.isNaN(part))) {
    return 0;
  }

  if (parts.length === 3) {
    return parts[0] * 60 + parts[1] + parts[2] / 60;
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  return parts[0] ?? 0;
}

export function calculateCourseDurationHours(lessons: LessonDuration[]): number {
  const totalMinutes = lessons.reduce((sum, lesson) => {
    if (!lesson.duration?.trim()) {
      return sum;
    }

    return sum + parseDurationToMinutes(lesson.duration);
  }, 0);

  if (totalMinutes <= 0) {
    return 0;
  }

  return Math.max(1, Math.round(totalMinutes / 60));
}
