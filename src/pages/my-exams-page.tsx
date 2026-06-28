import { Link, useNavigate } from "react-router-dom";
import { FileQuestionIcon } from "lucide-react";
import { ExamCard } from "@/components/exam/exam-card";
import { CardCourseSkeletonGrid } from "@/components/card-skeletons";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { useStudentExams } from "@/hooks/use-student-exams";
import type { StudentExamItem } from "@/types/exam";

function openExam(exam: StudentExamItem, navigate: ReturnType<typeof useNavigate>) {
  const slug = exam.course.slug;

  if (!exam.attempt || exam.attempt.status === "in_progress") {
    navigate(`/curso/${slug}/prova`);
    return;
  }

  navigate(`/curso/${slug}/prova/resultado`);
}

export function MyExamsPage() {
  const navigate = useNavigate();
  const { data: exams, loading } = useStudentExams();

  if (loading) {
    return (
      <div className="p-4">
        <CardCourseSkeletonGrid count={4} />
      </div>
    );
  }

  if (exams.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          icon={<FileQuestionIcon className="size-6" />}
          title="Nenhuma prova disponível"
          description="Quando houver provas publicadas nos seus cursos, elas aparecerão aqui."
          action={
            <Button asChild>
              <Link to="/meus-cursos">Ver meus cursos</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const pending = exams.filter((exam) => exam.attempt?.status === "in_progress");
  const waiting = exams.filter((exam) => exam.attempt?.status === "submitted");
  const available = exams.filter((exam) => !exam.attempt);
  const finished = exams.filter((exam) => exam.attempt?.status === "graded");

  function renderSection(title: string, items: StudentExamItem[]) {
    if (items.length === 0) return null;

    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex flex-wrap gap-6">
          {items.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              onOpen={() => openExam(exam, navigate)}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Provas</h1>
        <p className="text-sm text-muted-foreground">
          Acesse as provas dos cursos em que você está matriculado.
        </p>
      </div>

      {renderSection("Em andamento", pending)}
      {renderSection("Disponíveis", available)}
      {renderSection("Aguardando correção", waiting)}
      {renderSection("Concluídas", finished)}
    </div>
  );
}
