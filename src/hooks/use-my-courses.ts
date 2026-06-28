import { useQuery } from "@tanstack/react-query";
import { fetchMyCourses } from "@/services/courses";
import type { CourseWithProgress } from "@/types/database";

export function useMyCourses() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["my-courses"],
    queryFn: fetchMyCourses,
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
