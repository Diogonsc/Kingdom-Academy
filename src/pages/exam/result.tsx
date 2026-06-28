import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ScoreBadge } from "@/components/exam/score-badge";
import { Loading } from "@/components/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchCourseBySlug } from "@/services/courses";
import {
  fetchAttemptResult,
  fetchExamByCourse,
  submitExam,
} from "@/services/exams";
import type { AttemptWithDetails } from "@/types/exam";

export function ExamResultPage() {
  const { id: slug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<AttemptWithDetails | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!slug) return;

      try {
        const course = await fetchCourseBySlug(slug);
        if (!course) {
          toast.error("Curso não encontrado");
          navigate("/meus-cursos");
          return;
        }

        const exam = await fetchExamByCourse(course.id);
        if (!exam) {
          navigate(`/curso/${slug}`);
          return;
        }

        if (!exam.attempt) {
          navigate(`/curso/${slug}/prova`);
          return;
        }

        if (
          exam.attempt.status === "in_progress" &&
          exam.attempt.submitted_at
        ) {
          try {
            const recovered = await submitExam(exam.attempt.id);
            if (recovered.status === "graded" || recovered.status === "submitted") {
              const data = await fetchAttemptResult(exam.attempt.id);
              if (data) {
                setResult(data);
                return;
              }
            }
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "Erro ao finalizar envio da prova";
            setLoadError(message);
            toast.error(message);
            return;
          }
        }

        const data = await fetchAttemptResult(exam.attempt.id);
        if (!data) {
          setLoadError("Não foi possível carregar o resultado desta tentativa.");
          return;
        }
        setResult(data);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro ao carregar resultado";
        setLoadError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [navigate, slug]);

  if (loading) {
    return <Loading message="Carregando resultado..." />;
  }

  if (!result) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-muted-foreground">
          {loadError ?? "Resultado não encontrado."}
        </p>
        <Button variant="outline" onClick={() => navigate(`/curso/${slug}/prova`)}>
          Voltar à prova
        </Button>
      </div>
    );
  }

  const { exam, status } = result;
  const showFeedback =
    status === "graded" && exam.show_feedback_after_grading;

  if (status === "submitted") {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-4">
        <Button
          variant="ghost"
          className="gap-2"
          onClick={() => navigate(`/curso/${slug}`)}
        >
          <ArrowLeft className="size-4" />
          Voltar ao curso
        </Button>

        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <h1 className="text-2xl font-bold">Prova enviada!</h1>
          <p className="mt-2 text-muted-foreground">
            Sua prova foi enviada. Aguarde a correção do professor.
          </p>
        </div>
      </div>
    );
  }

  if (status === "in_progress") {
    navigate(`/curso/${slug}/prova`, { replace: true });
    return <Loading message="Redirecionando..." />;
  }

  const sortedAnswers = [...result.answers].sort(
    (a, b) => a.question.order_index - b.question.order_index,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <Button
        variant="ghost"
        className="gap-2"
        onClick={() => navigate(`/curso/${slug}`)}
      >
        <ArrowLeft className="size-4" />
        Voltar ao curso
      </Button>

      <div className="space-y-4 rounded-xl border border-border bg-card p-6 text-center">
        <h1 className="text-2xl font-bold">Prova concluída!</h1>
        <p className="text-3xl font-semibold">
          Sua nota: {result.final_score?.toFixed(1) ?? "—"} / 100
        </p>
        <ScoreBadge
          score={result.final_score}
          passed={result.passed}
          passingScore={exam.passing_score}
        />
        {result.admin_feedback ? (
          <div className="mx-auto max-w-xl rounded-lg bg-muted/50 p-4 text-left text-sm">
            <p className="mb-1 font-medium">Comentário do professor</p>
            <p className="text-muted-foreground">{result.admin_feedback}</p>
          </div>
        ) : null}
      </div>

      {showFeedback ? (
        <div className="space-y-4">
          {sortedAnswers.map((item, index) => {
            const { question } = item;
            const selectedOption = question.options?.find(
              (option) => option.id === item.selected_option_id,
            );
            const correctOption = question.options?.find(
              (option) => option.is_correct,
            );

            return (
              <div
                key={item.id}
                className="space-y-3 rounded-xl border border-border bg-card p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      Questão {index + 1} —{" "}
                      {question.type === "multiple_choice"
                        ? "Múltipla Escolha"
                        : "Dissertativa"}{" "}
                      — {question.points} pts
                    </span>
                  </div>
                  <Badge variant={item.score_earned > 0 ? "default" : "destructive"}>
                    {item.score_earned > 0 ? `+${item.score_earned}pt` : "0pt"}
                  </Badge>
                </div>

                <p className="text-sm">{question.statement}</p>

                {question.type === "multiple_choice" ? (
                  <div className="space-y-1 text-sm">
                    <p>
                      Sua resposta:{" "}
                      {selectedOption
                        ? `${selectedOption.label}) ${selectedOption.text}`
                        : "Não respondida"}
                      {item.is_correct ? (
                        <CheckCircle2 className="ml-1 inline size-4 text-emerald-600" />
                      ) : (
                        <XCircle className="ml-1 inline size-4 text-destructive" />
                      )}
                    </p>
                    {!item.is_correct && correctOption && showFeedback ? (
                      <p className="text-muted-foreground">
                        Gabarito: {correctOption.label}) {correctOption.text}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <p className="rounded-lg bg-muted/40 p-3">
                      {item.essay_answer || "Sem resposta"}
                    </p>
                    {item.admin_feedback ? (
                      <p className="text-muted-foreground">
                        Feedback: {item.admin_feedback}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : status === "graded" ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
          A nota foi publicada, mas o gabarito não está disponível para visualização.
        </div>
      ) : null}
    </div>
  );
}
