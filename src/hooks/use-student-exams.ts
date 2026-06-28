import { useQuery } from "@tanstack/react-query";
import { fetchStudentExams } from "@/services/exams";
import type { StudentExamItem } from "@/types/exam";

export function useStudentExams() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["student-exams"],
    queryFn: fetchStudentExams,
  });

  return {
    data: (data ?? []) as StudentExamItem[],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch: () => {
      void refetch();
    },
  };
}
