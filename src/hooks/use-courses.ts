import { useQuery } from "@tanstack/react-query";
import { fetchPublishedCourses } from "@/services/courses";
import type { CourseWithProgress } from "@/types/database";

export function useCourses() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["courses"],
    queryFn: fetchPublishedCourses,
  });

  return {
    data: (data ?? []) as CourseWithProgress[],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch: () => {
      void refetch();
    },
  };
}
