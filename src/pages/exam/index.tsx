import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock3 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { QuestionCard } from "@/components/exam/question-card";
import { QuestionNav } from "@/components/exam/question-nav";
import { Loading } from "@/components/loading";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchCourseBySlug } from "@/services/courses";
import {
  fetchAttemptAnswers,
  fetchExamByCourse,
  fetchExamQuestions,
  saveAnswer,
  startOrResumeAttempt,
  submitExam,
} from "@/services/exams";
import type {
  ExamAnswer,
  ExamAttempt,
  ExamQuestion,
  ExamWithAttempt,
} from "@/types/exam";

type PageState = "loading" | "instructions" | "taking" | "submitted";

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function isAnswered(question: ExamQuestion, answers: ExamAnswer[]) {
  const answer = answers.find((item) => item.question_id === question.id);
  if (!answer) return false;
  if (question.type === "multiple_choice") return Boolean(answer.selected_option_id);
  return Boolean(answer.essay_answer?.trim());
}

export function ExamPage() {
  const { id: slug } = useParams();
  const navigate = useNavigate();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [exam, setExam] = useState<ExamWithAttempt | null>(null);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<ExamAnswer[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const blankCount = useMemo(
    () => questions.filter((question) => !isAnswered(question, answers)).length,
    [questions, answers],
  );

  const loadExam = useCallback(async () => {
    if (!slug) return;

    const course = await fetchCourseBySlug(slug);
    if (!course) {
      toast.error("Curso não encontrado");
      navigate("/meus-cursos");
      return;
    }

    const examData = await fetchExamByCourse(course.id);
    if (!examData) {
      toast.error("Este curso não possui prova publicada");
      navigate(`/curso/${slug}`);
      return;
    }

    setExam(examData);
    setAttempt(examData.attempt);

    const examQuestions = await fetchExamQuestions(examData.id);
    setQuestions(examQuestions);

    if (
      examData.attempt?.status === "graded" &&
      !examData.canStartNew
    ) {
      navigate(`/curso/${slug}/prova/resultado`);
      return;
    }

    if (
      examData.attempt?.status === "graded" &&
      examData.canStartNew
    ) {
      setPageState("instructions");
      return;
    }

    if (
      examData.attempt?.status === "in_progress" &&
      examData.attempt.submitted_at
    ) {
      try {
        const recovered = await submitExam(examData.attempt.id);
        setAttempt(recovered);
        if (recovered.status === "graded") {
          navigate(`/curso/${slug}/prova/resultado`);
          return;
        }
        setPageState("submitted");
        return;
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Erro ao finalizar envio da prova",
        );
      }
    }

    if (examData.attempt?.status === "submitted") {
      setPageState("submitted");
      return;
    }

    if (examData.attempt?.status === "in_progress") {
      const savedAnswers = await fetchAttemptAnswers(examData.attempt.id);
      setAnswers(savedAnswers);
      setPageState("taking");
      return;
    }

    setPageState("instructions");
  }, [navigate, slug]);

  useEffect(() => {
    void loadExam();
  }, [loadExam]);

  useEffect(() => {
    if (pageState !== "taking" || !exam?.time_limit_minutes || !attempt) {
      setSecondsLeft(null);
      return;
    }

    const limitSeconds = exam.time_limit_minutes * 60;
    const elapsed = Math.floor(
      (Date.now() - new Date(attempt.started_at).getTime()) / 1000,
    );
    setSecondsLeft(Math.max(limitSeconds - elapsed, 0));
  }, [pageState, exam, attempt]);

  useEffect(() => {
    if (secondsLeft === null || pageState !== "taking") return;

    if (secondsLeft <= 0) {
      void handleSubmit(true);
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => (current !== null ? Math.max(current - 1, 0) : null));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [secondsLeft, pageState]);

  async function handleStart() {
    if (!exam) return;

    try {
      const newAttempt = await startOrResumeAttempt(exam.id);
      setAttempt(newAttempt);
      setPageState("taking");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao iniciar a prova",
      );
    }
  }

  async function handleAnswerChange(
    questionId: string,
    payload: { selected_option_id?: string; essay_answer?: string },
  ) {
    if (!attempt) return;

    try {
      await saveAnswer(attempt.id, questionId, payload);

      setAnswers((current) => {
        const existing = current.find((item) => item.question_id === questionId);

        if (existing) {
          return current.map((item) =>
            item.question_id === questionId ? { ...item, ...payload } : item,
          );
        }

        return [
          ...current,
          {
            id: crypto.randomUUID(),
            attempt_id: attempt.id,
            question_id: questionId,
            selected_option_id: payload.selected_option_id ?? null,
            essay_answer: payload.essay_answer ?? null,
            is_correct: null,
            score_earned: 0,
            admin_feedback: null,
          },
        ];
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar resposta",
      );
    }
  }

  async function handleSubmit(auto = false) {
    if (!attempt || submitting) return;

    if (!auto) setConfirmOpen(false);
    setSubmitting(true);

    try {
      const result = await submitExam(attempt.id);
      setAttempt(result);
      setPageState("submitted");

      if (result.status === "graded") {
        toast.success("Prova enviada e corrigida automaticamente!");
        navigate(`/curso/${slug}/prova/resultado`);
      } else {
        toast.success(
          auto
            ? "Tempo esgotado! Prova enviada automaticamente."
            : "Prova enviada! Aguarde a correção.",
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao enviar prova",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (pageState === "loading" || !exam) {
    return <Loading message="Carregando prova..." />;
  }

  if (pageState === "instructions") {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-4">
        <Button variant="ghost" className="gap-2" onClick={() => navigate(`/curso/${slug}`)}>
          <ArrowLeft className="size-4" />
          Voltar ao curso
        </Button>

        <div className="space-y-4 rounded-xl border border-border bg-card p-6">
          <h1 className="text-2xl font-bold">{exam.title}</h1>
          {exam.description ? (
            <p className="text-muted-foreground">{exam.description}</p>
          ) : null}
          {exam.instructions ? (
            <div className="rounded-lg bg-muted/50 p-4 text-sm">{exam.instructions}</div>
          ) : null}

          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• {questions.length} questões</li>
            <li>
              • Nota mínima para aprovação: {exam.passing_score} pontos
            </li>
            <li>
              • Tentativas: {exam.attemptsUsed} de {exam.max_attempts} utilizadas
              {exam.canStartNew ? " — você pode iniciar uma nova" : ""}
            </li>
            {exam.time_limit_minutes ? (
              <li>• Tempo limite: {exam.time_limit_minutes} minutos</li>
            ) : (
              <li>• Sem limite de tempo</li>
            )}
          </ul>

          {exam.attemptHistory.length > 0 ? (
            <div className="rounded-lg border border-border p-4 text-sm">
              <p className="mb-2 font-medium">Histórico de tentativas</p>
              <ul className="space-y-1 text-muted-foreground">
                {exam.attemptHistory.map((item) => (
                  <li key={item.id}>
                    Tentativa {item.attempt_number}: {item.status}
                    {item.final_score !== null
                      ? ` — ${Math.round(item.final_score)}%`
                      : ""}
                    {item.passed ? " (Aprovado)" : item.status === "graded" ? " (Reprovado)" : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {exam.attempt?.status === "graded" || exam.attempt?.status === "submitted" ? (
              <Button
                variant="outline"
                onClick={() => navigate(`/curso/${slug}/prova/resultado`)}
              >
                Ver último resultado
              </Button>
            ) : null}
            <Button
              size="lg"
              disabled={!exam.canStartNew}
              onClick={() => void handleStart()}
            >
              {exam.attemptsUsed > 0 ? "Nova tentativa" : "Iniciar Prova"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === "submitted") {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-4 text-center">
        <div className="rounded-xl border border-border bg-card p-8">
          <h1 className="text-2xl font-bold">Prova enviada!</h1>
          <p className="mt-2 text-muted-foreground">
            Sua prova foi enviada. Aguarde a correção do professor.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={() => navigate(`/curso/${slug}`)}>
              Voltar ao curso
            </Button>
            <Button onClick={() => navigate(`/curso/${slug}/prova/resultado`)}>
              Ver status
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[activeIndex];
  const currentAnswer =
    answers.find((item) => item.question_id === currentQuestion?.id) ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-card px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate(`/curso/${slug}`)}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <p className="truncate text-sm font-medium">Prova: {exam.title}</p>
        </div>

        <div className="flex items-center gap-3">
          {secondsLeft !== null ? (
            <span className="flex items-center gap-1 text-sm font-medium text-amber-600">
              <Clock3 className="size-4" />
              {formatTime(secondsLeft)}
            </span>
          ) : null}
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={submitting}
          >
            Finalizar Prova
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-4 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-6 rounded-xl border border-border bg-card p-6">
          {currentQuestion ? (
            <QuestionCard
              question={currentQuestion}
              answer={currentAnswer}
              questionNumber={activeIndex + 1}
              totalQuestions={questions.length}
              isActive
              onAnswerChange={(payload) =>
                void handleAnswerChange(currentQuestion.id, payload)
              }
            />
          ) : null}

          <div className="flex items-center justify-between border-t border-border pt-4">
            <Button
              variant="outline"
              disabled={activeIndex === 0}
              onClick={() => setActiveIndex((index) => index - 1)}
            >
              ← Anterior
            </Button>
            <Button
              variant="outline"
              disabled={activeIndex >= questions.length - 1}
              onClick={() => setActiveIndex((index) => index + 1)}
            >
              Próxima →
            </Button>
          </div>
        </div>

        <div className="w-full shrink-0 lg:w-72">
          <QuestionNav
            questions={questions}
            answers={answers}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
          />
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar prova?</DialogTitle>
            <DialogDescription>
              Você deixou {blankCount} questão{blankCount !== 1 ? "ões" : ""} em
              branco. Deseja enviar a prova agora?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Continuar respondendo
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={submitting}>
              {submitting ? "Enviando..." : "Confirmar envio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
