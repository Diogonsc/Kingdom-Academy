import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Loading } from "@/components/loading";
import {
  CourseThumbnailUpload,
} from "@/components/admin/course-thumbnail-upload";
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
  createLesson,
  createModule,
  deleteLesson,
  deleteModule,
  fetchCourseById,
  fetchCourseLessons,
  fetchCourseModules,
  reorderLesson,
  updateCourse,
  updateLesson,
} from "@/services/courses";
import type { Course, CourseModule, Lesson } from "@/types/database";

const courseSchema = z.object({
  title: z.string().min(1, "Informe o título"),
  description: z.string().min(1, "Informe a descrição"),
  thumbnail_url: z.string().optional(),
  requires_enrollment: z.boolean(),
  is_published: z.boolean(),
});

const lessonSchema = z.object({
  title: z.string().min(1, "Informe o título da aula"),
  description: z.string().optional(),
  video_id: z.string().optional(),
  duration: z.string().optional(),
  module_id: z.string().optional(),
});

type CourseFormValues = z.infer<typeof courseSchema>;
type LessonFormValues = z.infer<typeof lessonSchema>;

export function NewCoursePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loadingCourse, setLoadingCourse] = useState(true);
  const [savedCourse, setSavedCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState(false);

  const courseForm = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      thumbnail_url: "",
      requires_enrollment: false,
      is_published: false,
    },
  });

  const lessonForm = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: "",
      description: "",
      video_id: "",
      duration: "",
      module_id: "",
    },
  });

  async function loadModules(courseId: string) {
    const data = await fetchCourseModules(courseId);
    setModules(data);
  }

  async function loadLessons(courseId: string) {
    setLoadingLessons(true);
    const data = await fetchCourseLessons(courseId);
    setLessons(data);
    setLoadingLessons(false);
  }

  async function loadCourseContent(courseId: string) {
    await Promise.all([loadLessons(courseId), loadModules(courseId)]);
  }

  const activeCourseId = savedCourse?.id ?? id;

  async function handleAddModule() {
    if (!activeCourseId || !newModuleTitle.trim()) return;

    try {
      await createModule(activeCourseId, newModuleTitle.trim(), modules.length);
      setNewModuleTitle("");
      await loadModules(activeCourseId);
      toast.success("Módulo criado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar módulo");
    }
  }

  async function handleDeleteModule(moduleId: string) {
    if (!activeCourseId) return;

    try {
      await deleteModule(moduleId);
      await loadCourseContent(activeCourseId);
      toast.success("Módulo removido");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover módulo");
    }
  }

  useEffect(() => {
    if (!id) {
      navigate("/admin/cursos", { replace: true });
      return;
    }

    async function loadCourse() {
      const course = await fetchCourseById(id as string);
      if (!course) {
        toast.error("Curso não encontrado");
        navigate("/admin/cursos");
        return;
      }

      setSavedCourse(course);
      courseForm.reset({
        title: course.title,
        description: course.description,
        thumbnail_url: course.thumbnail_url ?? "",
        requires_enrollment: course.requires_enrollment,
        is_published: course.is_published,
      });
      await loadCourseContent(course.id);
      setLoadingCourse(false);
    }

    void loadCourse();
  }, [id, courseForm, navigate]);

  async function onSubmitCourse(values: CourseFormValues) {
    if (!id) return;

    try {
      const updated = await updateCourse(id, values);
      setSavedCourse(updated);
      toast.success("Curso atualizado com sucesso");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar curso");
    }
  }

  async function onSubmitLesson(values: LessonFormValues) {
    if (!activeCourseId) return;

    const payload = {
      ...values,
      module_id: values.module_id || null,
    };

    try {
      if (editingLessonId) {
        await updateLesson(editingLessonId, payload);
        toast.success("Aula atualizada com sucesso");
      } else {
        await createLesson(activeCourseId, payload, lessons.length);
        toast.success("Aula adicionada com sucesso");
      }

      lessonForm.reset();
      setEditingLessonId(null);
      await loadCourseContent(activeCourseId);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : editingLessonId
            ? "Erro ao atualizar aula"
            : "Erro ao adicionar aula",
      );
    }
  }

  function handleEditLesson(lesson: Lesson) {
    setEditingLessonId(lesson.id);
    lessonForm.reset({
      title: lesson.title,
      description: lesson.description ?? "",
      video_id: lesson.video_id ?? "",
      duration: lesson.duration ?? "",
    });
  }

  function handleCancelEditLesson() {
    setEditingLessonId(null);
    lessonForm.reset({
      title: "",
      description: "",
      video_id: "",
      duration: "",
    });
  }

  async function handleDeleteLesson() {
    if (!activeCourseId || !lessonToDelete) return;

    setDeletingLesson(true);

    try {
      await deleteLesson(lessonToDelete.id);
      if (editingLessonId === lessonToDelete.id) {
        handleCancelEditLesson();
      }
      toast.success("Aula excluída");
      setLessonToDelete(null);
      await loadCourseContent(activeCourseId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir aula");
    } finally {
      setDeletingLesson(false);
    }
  }

  async function handleMoveLesson(lesson: Lesson, direction: "up" | "down") {
    if (!activeCourseId) return;

    const currentIndex = lessons.findIndex((item) => item.id === lesson.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const targetLesson = lessons[targetIndex];

    if (!targetLesson) return;

    try {
      await Promise.all([
        reorderLesson(lesson.id, targetLesson.order_index),
        reorderLesson(targetLesson.id, lesson.order_index),
      ]);
      await loadCourseContent(activeCourseId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao reordenar aulas");
    }
  }

  const sortedLessons = useMemo(
    () => [...lessons].sort((a, b) => a.order_index - b.order_index),
    [lessons],
  );

  if (loadingCourse) {
    return <Loading message="Carregando curso..." />;
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Editar Curso</h1>
        <p className="text-sm text-muted-foreground">
          Atualize as informações do curso e gerencie suas aulas.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do curso</CardTitle>
          <CardDescription>Dados principais exibidos na plataforma.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={courseForm.handleSubmit(onSubmitCourse)}
          >
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" {...courseForm.register("title")} />
              {courseForm.formState.errors.title ? (
                <p className="text-sm text-destructive">
                  {courseForm.formState.errors.title.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <textarea
                id="description"
                rows={4}
                className="flex min-h-[96px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                {...courseForm.register("description")}
              />
              {courseForm.formState.errors.description ? (
                <p className="text-sm text-destructive">
                  {courseForm.formState.errors.description.message}
                </p>
              ) : null}
            </div>

            <CourseThumbnailUpload
              className="md:col-span-2"
              value={courseForm.watch("thumbnail_url")}
              courseId={id}
              onChange={(url) => {
                courseForm.setValue("thumbnail_url", url, { shouldDirty: true });

                if (!id) return;

                void updateCourse(id, {
                  ...courseForm.getValues(),
                  thumbnail_url: url,
                })
                  .then((updated) => {
                    setSavedCourse(updated);
                    toast.success("Capa do curso atualizada");
                  })
                  .catch((error) => {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Erro ao salvar capa do curso",
                    );
                  });
              }}
              disabled={courseForm.formState.isSubmitting}
            />

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...courseForm.register("requires_enrollment")} />
              Requer matrícula
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...courseForm.register("is_published")} />
              Publicado
            </label>

            <div className="md:col-span-2">
              <Button type="submit" disabled={courseForm.formState.isSubmitting}>
                {courseForm.formState.isSubmitting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                Salvar alterações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {activeCourseId ? (
        <Card>
          <CardHeader>
            <CardTitle>Módulos do curso</CardTitle>
            <CardDescription>
              Organize as aulas em módulos ou seções.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {modules.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum módulo criado. As aulas serão exibidas em lista simples.
              </p>
            ) : (
              <ul className="space-y-2">
                {modules.map((mod, index) => (
                  <li
                    key={mod.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="text-sm font-medium">
                      {index + 1}. {mod.title}
                    </span>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => void handleDeleteModule(mod.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="Nome do módulo"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
              />
              <Button type="button" onClick={() => void handleAddModule()}>
                <Plus className="size-4" />
                Adicionar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {activeCourseId ? (
        <Card>
          <CardHeader>
            <CardTitle>Gerenciamento de Aulas</CardTitle>
            <CardDescription>
              Adicione, edite, reordene ou remova as aulas deste curso.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loadingLessons ? (
              <Loading message="Carregando aulas..." fullPage={false} />
            ) : (
              <div className="space-y-3">
                {sortedLessons.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma aula cadastrada ainda.
                  </p>
                ) : (
                  sortedLessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 ${
                        editingLessonId === lesson.id
                          ? "border-primary bg-primary/5"
                          : ""
                      }`}
                    >
                      <div>
                        <p className="font-medium">
                          {index + 1}. {lesson.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {lesson.duration ?? "Sem duração"} •{" "}
                          {lesson.video_id ?? "Sem vídeo"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditLesson(lesson)}
                          aria-label={`Editar aula ${lesson.title}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={index === 0}
                          onClick={() => void handleMoveLesson(lesson, "up")}
                        >
                          <ArrowUp className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={index === sortedLessons.length - 1}
                          onClick={() => void handleMoveLesson(lesson, "down")}
                        >
                          <ArrowDown className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => setLessonToDelete(lesson)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={lessonForm.handleSubmit(onSubmitLesson)}
            >
              <div className="md:col-span-2">
                <p className="text-sm font-medium">
                  {editingLessonId ? "Editar aula" : "Nova aula"}
                </p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="lesson-title">Título da aula</Label>
                <Input id="lesson-title" {...lessonForm.register("title")} />
                {lessonForm.formState.errors.title ? (
                  <p className="text-sm text-destructive">
                    {lessonForm.formState.errors.title.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="lesson-description">Descrição</Label>
                <textarea
                  id="lesson-description"
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  {...lessonForm.register("description")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="video_id">YouTube URL ou ID do vídeo</Label>
                <Input id="video_id" {...lessonForm.register("video_id")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duração (ex: 12:30)</Label>
                <Input id="duration" {...lessonForm.register("duration")} />
              </div>
              {modules.length > 0 ? (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="module_id">Módulo</Label>
                  <select
                    id="module_id"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    {...lessonForm.register("module_id")}
                  >
                    <option value="">Sem módulo</option>
                    {modules.map((mod) => (
                      <option key={mod.id} value={mod.id}>
                        {mod.title}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2 md:col-span-2">
                <Button type="submit" disabled={lessonForm.formState.isSubmitting}>
                  {lessonForm.formState.isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : editingLessonId ? null : (
                    <Plus className="size-4" />
                  )}
                  {editingLessonId ? "Salvar alterações" : "Adicionar aula"}
                </Button>
                {editingLessonId ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEditLesson}
                    disabled={lessonForm.formState.isSubmitting}
                  >
                    <X className="size-4" />
                    Cancelar
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Dialog
        open={Boolean(lessonToDelete)}
        onOpenChange={(open) => {
          if (!open) setLessonToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a aula &quot;{lessonToDelete?.title}
              &quot;? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deletingLesson}
              onClick={() => void handleDeleteLesson()}
            >
              {deletingLesson ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
