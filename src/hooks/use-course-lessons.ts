import { useCallback, useEffect, useState } from "react";
import { fetchCourseLessons } from "@/services/courses";
import type { Lesson } from "@/types/database";

export function useCourseLessons(courseId: string | undefined) {
  const [data, setData] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!courseId) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const lessons = await fetchCourseLessons(courseId);
      setData(lessons);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar aulas");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
