import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { Loading } from "@/components/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchExamAttempts,
  fetchExamWithQuestions,
  gradeAttempt,
} from "@/services/exams";
import type { AttemptWithDetails, Exam } from "@/types/exam";

type EssayGradeDraft = {
  answerId: string;
  score_earned: number;
  admin_feedback: string;
};

export function ExamCorrectionsPage() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<(Exam & { questions?: unknown[] }) | null>(
    null,
  );
  const [attempts, setAttempts] = useState<AttemptWithDetails[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [essayGrades, setEssayGrades] = useState<Record<string, EssayGradeDraft>>(
    {},
  );
  const [adminFeedback, setAdminFeedback] = useState("");
  const [publishing, setPublishing] = useState(false);

  const selectedAttempt = attempts.find((item) => item.id === selectedId) ?? null;

  const stats = useMemo(() => {
    const submitted = attempts.filter((item) => item.status === "submitted").length;
    const graded = attempts.filter((item) => item.status === "graded").length;
    return { submitted, graded };
  }, [attempts]);

  const predictedScore = useMemo(() => {
    if (!selectedAttempt) return 0;

    const totalPoints = selectedAttempt.answers.reduce(
      (sum, answer) => sum + answer.question.points,
      0,
    );

    const earnedPoints = selectedAttempt.answers.reduce((sum, answer) => {
      if (answer.question.type === "essay") {
        const draft = essayGrades[answer.id];
        return sum + (draft?.score_earned ?? answer.score_earned ?? 0);
      }
      return sum + (answer.score_earned ?? 0);
    }, 0);

    return totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
  }, [selectedAttempt, essayGrades]);

  async function loadData() {
    if (!examId) return;

    setLoading(true);
    try {
      const [examData, attemptsData] = await Promise.all([
        fetchExamWithQuestions(examId),
        fetchExamAttempts(examId),
      ]);

      setExam(examData as Exam);
      setAttempts(attemptsData);

      const firstPending =
        attemptsData.find((item) => item.status === "submitted") ??
        attemptsData[0] ??
        null;

      setSelectedId(firstPending?.id ?? null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao carregar correções",
      );
      navigate("/admin/provas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [examId]);

  useEffect(() => {
    if (!selectedAttempt) {
      setEssayGrades({});
      setAdminFeedback("");
      return;
    }

    const drafts: Record<string, EssayGradeDraft> = {};
    for (const answer of selectedAttempt.answers) {
      if (answer.question.type === "essay") {
        drafts[answer.id] = {
          answerId: answer.id,
          score_earned: answer.score_earned ?? 0,
          admin_feedback: answer.admin_feedback ?? "",
        };
      }
    }

    setEssayGrades(drafts);
    setAdminFeedback(selectedAttempt.admin_feedback ?? "");
  }, [selectedAttempt]);

  async function handlePublish() {
    if (!selectedAttempt) return;

    const essayAnswers = selectedAttempt.answers.filter(
      (answer) => answer.question.type === "essay",
    );

    const corrections = essayAnswers.map((answer) => {
      const draft = essayGrades[answer.id];
      return {
        answerId: answer.id,
        score_earned: draft?.score_earned ?? 0,
        admin_feedback: draft?.admin_feedback,
      };
    });

    setPublishing(true);
    try {
      await gradeAttempt(selectedAttempt.id, corrections, adminFeedback);
      toast.success("Nota publicada com sucesso");
      await loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao publicar nota",
      );
    } finally {
      setPublishing(false);
    }
  }

  if (loading || !exam) {
    return <Loading message="Carregando correções..." />;
  }

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Correções — {exam.title}</h1>
        <p className="text-sm text-muted-foreground">
          {stats.submitted} enviada{stats.submitted !== 1 ? "s" : ""} |{" "}
          {stats.graded} corrigida{stats.graded !== 1 ? "s" : ""} |{" "}
          {stats.submitted} aguardando
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2 rounded-xl border border-border bg-card p-3">
          <h2 className="px-2 text-sm font-semibold">Alunos</h2>
          {attempts.length === 0 ? (
            <p className="px-2 text-sm text-muted-foreground">
              Nenhuma tentativa enviada.
            </p>
          ) : (
            attempts.map((attempt) => {
              const isSelected = attempt.id === selectedId;
              const isGraded = attempt.status === "graded";

              return (
                <button
                  key={attempt.id}
                  type="button"
                  onClick={() => setSelectedId(attempt.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  }`}
                >
                  {isGraded ? (
                    <CheckCircle2 className="size-4 text-emerald-600" />
                  ) : (
                    <Clock3 className="size-4 text-amber-600" />
                  )}
                  {attempt.profile.name}
                </button>
              );
            })
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          {!selectedAttempt ? (
            <p className="text-muted-foreground">
              Selecione um aluno para corrigir a prova.
            </p>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">
                  Correção — {selectedAttempt.profile.name}
                </h2>
                {selectedAttempt.submitted_at ? (
                  <p className="text-sm text-muted-foreground">
                    Enviada em:{" "}
                    {new Date(selectedAttempt.submitted_at).toLocaleString("pt-BR")}
                  </p>
                ) : null}
              </div>

              {[...selectedAttempt.answers]
                .sort(
                  (a, b) => a.question.order_index - b.question.order_index,
                )
                .map((answer, index) => {
                  const { question } = answer;

                  if (question.type === "multiple_choice") {
                    const selectedOption = question.options?.find(
                      (option) => option.id === answer.selected_option_id,
                    );

                    return (
                      <div
                        key={answer.id}
                        className="space-y-2 rounded-lg border border-border p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium">
                            Q{index + 1} — Múltipla Escolha
                          </p>
                          <Badge variant={answer.is_correct ? "default" : "destructive"}>
                            {answer.is_correct ? "Correta" : "Incorreta"} —{" "}
                            {answer.score_earned}pt
                          </Badge>
                        </div>
                        <p className="text-sm">{question.statement}</p>
                        <p className="text-sm text-muted-foreground">
                          Resposta:{" "}
                          {selectedOption
                            ? `${selectedOption.label}) ${selectedOption.text}`
                            : "Não respondida"}
                        </p>
                      </div>
                    );
                  }

                  const draft = essayGrades[answer.id];

                  return (
                    <div
                      key={answer.id}
                      className="space-y-3 rounded-lg border border-border p-4"
                    >
                      <p className="font-medium">
                        Q{index + 1} — Dissertativa — {question.points}pts
                      </p>
                      <p className="text-sm">{question.statement}</p>
                      {question.expected_answer ? (
                        <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                          Gabarito: {question.expected_answer}
                        </p>
                      ) : null}
                      <p className="rounded-lg bg-muted/20 p-3 text-sm">
                        {answer.essay_answer || "Sem resposta"}
                      </p>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Nota desta questão</Label>
                          <Input
                            type="number"
                            min={0}
                            max={question.points}
                            step={0.5}
                            value={draft?.score_earned ?? 0}
                            disabled={selectedAttempt.status === "graded"}
                            onChange={(event) =>
                              setEssayGrades((current) => ({
                                ...current,
                                [answer.id]: {
                                  answerId: answer.id,
                                  score_earned: Number(event.target.value),
                                  admin_feedback:
                                    current[answer.id]?.admin_feedback ?? "",
                                },
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Feedback</Label>
                          <textarea
                            rows={3}
                            value={draft?.admin_feedback ?? ""}
                            disabled={selectedAttempt.status === "graded"}
                            onChange={(event) =>
                              setEssayGrades((current) => ({
                                ...current,
                                [answer.id]: {
                                  answerId: answer.id,
                                  score_earned:
                                    current[answer.id]?.score_earned ?? 0,
                                  admin_feedback: event.target.value,
                                },
                              }))
                            }
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

              <div className="space-y-3 border-t border-border pt-4">
                <div className="space-y-2">
                  <Label>Feedback geral</Label>
                  <textarea
                    rows={3}
                    value={adminFeedback}
                    disabled={selectedAttempt.status === "graded"}
                    onChange={(event) => setAdminFeedback(event.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium">
                    Nota final calculada: {predictedScore.toFixed(1)} / 100
                  </p>
                  {selectedAttempt.status === "submitted" ? (
                    <Button
                      onClick={() => void handlePublish()}
                      disabled={publishing}
                    >
                      {publishing ? "Publicando..." : "Publicar Nota"}
                    </Button>
                  ) : (
                    <Badge variant="default">Corrigida</Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
