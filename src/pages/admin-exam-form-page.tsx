import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Loading } from "@/components/loading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchAllCoursesAdmin } from "@/services/courses";
import {
  createExam,
  deleteQuestion,
  fetchExamWithQuestions,
  reorderQuestion,
  saveQuestion,
  saveQuestionOptions,
  updateExam,
} from "@/services/exams";
import type { CourseWithProgress } from "@/types/database";
import type { ExamQuestion, QuestionType } from "@/types/exam";

const examSchema = z.object({
  title: z.string().min(1, "Informe o título"),
  course_id: z.string().min(1, "Selecione um curso"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  passing_score: z.number().min(0).max(100),
  max_attempts: z.number().min(1).max(10),
  time_limit_minutes: z.string().optional(),
  available_from: z.string().optional(),
  available_until: z.string().optional(),
  show_feedback_after_grading: z.boolean(),
  is_published: z.boolean(),
});

type ExamFormValues = z.infer<typeof examSchema>;

const LABELS = ["A", "B", "C", "D", "E"] as const;

type OptionDraft = {
  label: (typeof LABELS)[number];
  text: string;
  is_correct: boolean;
};

const emptyOptions = (): OptionDraft[] =>
  LABELS.map((label) => ({ label, text: "", is_correct: false }));

export function ExamFormPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(examId);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [savedExamId, setSavedExamId] = useState<string | null>(examId ?? null);
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [questions, setQuestions] = useState<
    (ExamQuestion & { options?: { id: string; label: string; text: string; is_correct: boolean; order_index: number }[] })[]
  >([]);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(
    null,
  );
  const [questionType, setQuestionType] = useState<QuestionType>("multiple_choice");
  const [questionStatement, setQuestionStatement] = useState("");
  const [questionPoints, setQuestionPoints] = useState("1");
  const [expectedAnswer, setExpectedAnswer] = useState("");
  const [options, setOptions] = useState<OptionDraft[]>(emptyOptions());
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<ExamQuestion | null>(
    null,
  );
  const [deletingQuestion, setDeletingQuestion] = useState(false);

  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: "",
      course_id: "",
      description: "",
      instructions: "",
      passing_score: 60,
      max_attempts: 1,
      time_limit_minutes: "",
      available_from: "",
      available_until: "",
      show_feedback_after_grading: true,
      is_published: false,
    },
  });

  async function loadCourses() {
    const data = await fetchAllCoursesAdmin();
    setCourses(data);
  }

  async function loadExam(id: string) {
    setLoading(true);
    try {
      const data = await fetchExamWithQuestions(id);
      form.reset({
        title: data.title,
        course_id: data.course_id,
        description: data.description ?? "",
        instructions: data.instructions ?? "",
        passing_score: Number(data.passing_score),
        max_attempts: Number(data.max_attempts ?? 1),
        time_limit_minutes: data.time_limit_minutes?.toString() ?? "",
        available_from: data.available_from
          ? data.available_from.slice(0, 16)
          : "",
        available_until: data.available_until
          ? data.available_until.slice(0, 16)
          : "",
        show_feedback_after_grading: data.show_feedback_after_grading,
        is_published: data.is_published,
      });
      setQuestions(data.questions ?? []);
      setSavedExamId(id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao carregar prova",
      );
      navigate("/admin/provas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCourses();
    if (examId) void loadExam(examId);
  }, [examId]);

  async function onSubmit(values: ExamFormValues) {
    setSaving(true);

    try {
      const payload = {
        title: values.title,
        course_id: values.course_id,
        description: values.description || null,
        instructions: values.instructions || null,
        passing_score: values.passing_score,
        max_attempts: values.max_attempts,
        time_limit_minutes: values.time_limit_minutes
          ? Number(values.time_limit_minutes)
          : null,
        available_from: values.available_from
          ? new Date(values.available_from).toISOString()
          : null,
        available_until: values.available_until
          ? new Date(values.available_until).toISOString()
          : null,
        show_feedback_after_grading: values.show_feedback_after_grading,
        is_published: values.is_published,
      };

      if (savedExamId) {
        await updateExam(savedExamId, payload);
        toast.success("Prova atualizada");
      } else {
        const created = await createExam(payload);
        setSavedExamId(created.id);
        toast.success("Prova criada! Agora adicione as questões.");
        navigate(`/admin/provas/${created.id}/editar`, { replace: true });
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar prova",
      );
    } finally {
      setSaving(false);
    }
  }

  function openQuestionDialog(question?: ExamQuestion) {
    if (question) {
      setEditingQuestion(question);
      setQuestionType(question.type);
      setQuestionStatement(question.statement);
      setQuestionPoints(String(question.points));
      setExpectedAnswer(question.expected_answer ?? "");

      if (question.type === "multiple_choice" && question.options) {
        setOptions(
          LABELS.map((label) => {
            const existing = question.options?.find((opt) => opt.label === label);
            return {
              label,
              text: existing?.text ?? "",
              is_correct: existing?.is_correct ?? false,
            };
          }),
        );
      } else {
        setOptions(emptyOptions());
      }
    } else {
      setEditingQuestion(null);
      setQuestionType("multiple_choice");
      setQuestionStatement("");
      setQuestionPoints("1");
      setExpectedAnswer("");
      setOptions(emptyOptions());
    }

    setQuestionDialogOpen(true);
  }

  async function handleSaveQuestion() {
    if (!savedExamId) {
      toast.error("Salve as configurações da prova antes de adicionar questões");
      return;
    }

    if (!questionStatement.trim()) {
      toast.error("Informe o enunciado da questão");
      return;
    }

    if (questionType === "multiple_choice") {
      const filled = options.filter((option) => option.text.trim());
      const correctCount = filled.filter((option) => option.is_correct).length;

      if (filled.length < 2) {
        toast.error("Preencha pelo menos 2 alternativas");
        return;
      }

      if (correctCount !== 1) {
        toast.error("Marque exatamente uma alternativa como correta");
        return;
      }
    }

    setSavingQuestion(true);

    try {
      const saved = await saveQuestion({
        id: editingQuestion?.id,
        exam_id: savedExamId,
        type: questionType,
        statement: questionStatement.trim(),
        points: Number(questionPoints) || 1,
        expected_answer:
          questionType === "essay" ? expectedAnswer.trim() || null : null,
        order_index: editingQuestion?.order_index ?? questions.length,
      });

      if (questionType === "multiple_choice") {
        await saveQuestionOptions(
          saved.id,
          options
            .filter((option) => option.text.trim())
            .map((option) => ({
              label: option.label,
              text: option.text.trim(),
              is_correct: option.is_correct,
            })),
        );
      }

      toast.success(editingQuestion ? "Questão atualizada" : "Questão adicionada");
      setQuestionDialogOpen(false);
      if (savedExamId) await loadExam(savedExamId);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar questão",
      );
    } finally {
      setSavingQuestion(false);
    }
  }

  async function handleDeleteQuestion() {
    if (!questionToDelete) return;

    setDeletingQuestion(true);

    try {
      await deleteQuestion(questionToDelete.id);
      toast.success("Questão removida");
      setQuestionToDelete(null);
      if (savedExamId) await loadExam(savedExamId);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao remover questão",
      );
    } finally {
      setDeletingQuestion(false);
    }
  }

  async function handleMoveQuestion(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const current = questions[index];
    const target = questions[targetIndex];

    try {
      await Promise.all([
        reorderQuestion(current.id, target.order_index),
        reorderQuestion(target.id, current.order_index),
      ]);
      if (savedExamId) await loadExam(savedExamId);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao reordenar questões",
      );
    }
  }

  if (loading) {
    return <Loading message="Carregando prova..." />;
  }

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">
          {isEditing ? "Editar Prova" : "Nova Prova"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure a prova e adicione as questões.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurações da Prova</CardTitle>
          <CardDescription>
            Informações gerais e regras de avaliação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" {...form.register("title")} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Curso vinculado</Label>
              <Select
                value={form.watch("course_id")}
                onValueChange={(value) => form.setValue("course_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um curso" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <textarea
                id="description"
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register("description")}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="instructions">Instruções para o aluno</Label>
              <textarea
                id="instructions"
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register("instructions")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passing_score">Nota mínima (%)</Label>
              <Input
                id="passing_score"
                type="number"
                min={0}
                max={100}
                {...form.register("passing_score", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_attempts">Máximo de tentativas</Label>
              <Input
                id="max_attempts"
                type="number"
                min={1}
                max={10}
                {...form.register("max_attempts", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time_limit_minutes">Limite de tempo (min)</Label>
              <Input
                id="time_limit_minutes"
                type="number"
                placeholder="Sem limite"
                {...form.register("time_limit_minutes")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="available_from">Disponível de</Label>
              <Input
                id="available_from"
                type="datetime-local"
                {...form.register("available_from")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="available_until">Disponível até</Label>
              <Input
                id="available_until"
                type="datetime-local"
                {...form.register("available_until")}
              />
            </div>

            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                {...form.register("show_feedback_after_grading")}
              />
              Mostrar gabarito após correção
            </label>

            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input type="checkbox" {...form.register("is_published")} />
              Publicada
            </label>

            <div className="md:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar configurações"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {savedExamId ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Questões ({questions.length})</CardTitle>
              <CardDescription>
                Adicione questões de múltipla escolha ou dissertativas.
              </CardDescription>
            </div>
            <Button onClick={() => openQuestionDialog()}>
              <Plus className="size-4" />
              Adicionar Questão
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {questions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma questão cadastrada ainda.
              </p>
            ) : (
              questions.map((question, index) => (
                <div
                  key={question.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border p-4"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-medium">
                      Q{index + 1} —{" "}
                      {question.type === "multiple_choice"
                        ? "Múltipla Escolha"
                        : "Dissertativa"}{" "}
                      — {question.points}pt
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {question.statement}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="icon-sm"
                      variant="outline"
                      disabled={index === 0}
                      onClick={() => void handleMoveQuestion(index, "up")}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="outline"
                      disabled={index === questions.length - 1}
                      onClick={() => void handleMoveQuestion(index, "down")}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openQuestionDialog(question)}
                    >
                      <Pencil className="size-3.5" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setQuestionToDelete(question)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? "Editar Questão" : "Nova Questão"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={questionType === "multiple_choice"}
                  onChange={() => setQuestionType("multiple_choice")}
                />
                Múltipla Escolha
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={questionType === "essay"}
                  onChange={() => setQuestionType("essay")}
                />
                Dissertativa
              </label>
            </div>

            <div className="space-y-2">
              <Label>Pontos</Label>
              <Input
                type="number"
                min={0}
                value={questionPoints}
                onChange={(event) => setQuestionPoints(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Enunciado</Label>
              <textarea
                rows={4}
                value={questionStatement}
                onChange={(event) => setQuestionStatement(event.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            {questionType === "multiple_choice" ? (
              <div className="space-y-3">
                <Label>Alternativas</Label>
                {options.map((option, index) => (
                  <div key={option.label} className="flex items-center gap-2">
                    <span className="w-6 text-sm font-semibold">
                      {option.label})
                    </span>
                    <Input
                      value={option.text}
                      onChange={(event) => {
                        const next = [...options];
                        next[index] = { ...next[index], text: event.target.value };
                        setOptions(next);
                      }}
                    />
                    <label className="flex shrink-0 items-center gap-1 text-xs">
                      <input
                        type="radio"
                        name="correct-option"
                        checked={option.is_correct}
                        onChange={() => {
                          setOptions(
                            options.map((item, itemIndex) => ({
                              ...item,
                              is_correct: itemIndex === index,
                            })),
                          );
                        }}
                      />
                      Correta
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Gabarito de referência (apenas admin)</Label>
                <textarea
                  rows={4}
                  value={expectedAnswer}
                  onChange={(event) => setExpectedAnswer(event.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => void handleSaveQuestion()}
              disabled={savingQuestion}
            >
              {savingQuestion ? "Salvando..." : "Salvar Questão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(questionToDelete)}
        onOpenChange={(open) => {
          if (!open) setQuestionToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta questão? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestionToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deletingQuestion}
              onClick={() => void handleDeleteQuestion()}
            >
              {deletingQuestion ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
