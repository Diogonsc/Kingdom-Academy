import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  CourseThumbnailUpload,
  uploadPendingCourseThumbnail,
} from "@/components/admin/course-thumbnail-upload";
import { Button } from "@/components/ui/button";
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
import { createCourse, updateCourse } from "@/services/courses";

const courseSchema = z.object({
  title: z.string().min(1, "Informe o título"),
  description: z.string().min(1, "Informe a descrição"),
  thumbnail_url: z.string().optional(),
  requires_enrollment: z.boolean(),
  is_published: z.boolean(),
});

type CourseFormValues = z.infer<typeof courseSchema>;

const defaultValues: CourseFormValues = {
  title: "",
  description: "",
  thumbnail_url: "",
  requires_enrollment: false,
  is_published: false,
};

type NewCourseModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
};

export function NewCourseModal({ open, onOpenChange, onCreated }: NewCourseModalProps) {
  const navigate = useNavigate();
  const [pendingThumbnail, setPendingThumbnail] = useState<File | null>(null);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      form.reset(defaultValues);
      setPendingThumbnail(null);
    }
  }, [open, form]);

  async function onSubmit(values: CourseFormValues) {
    try {
      const created = await createCourse({
        ...values,
        thumbnail_url: undefined,
      });

      if (pendingThumbnail) {
        const thumbnailUrl = await uploadPendingCourseThumbnail(
          pendingThumbnail,
          created.id,
        );

        await updateCourse(created.id, {
          ...values,
          thumbnail_url: thumbnailUrl,
        });
      }

      toast.success("Curso criado com sucesso");
      onOpenChange(false);
      onCreated?.();
      navigate(`/admin/cursos/${created.id}/editar`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar curso");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Curso</DialogTitle>
          <DialogDescription>
            Preencha as informações básicas. Após criar, você poderá adicionar as aulas.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="space-y-2">
            <Label htmlFor="new-course-title">Título</Label>
            <Input id="new-course-title" {...form.register("title")} />
            {form.formState.errors.title ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.title.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-course-description">Descrição</Label>
            <textarea
              id="new-course-description"
              rows={4}
              className="flex min-h-[96px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              {...form.register("description")}
            />
            {form.formState.errors.description ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.description.message}
              </p>
            ) : null}
          </div>

          <CourseThumbnailUpload
            onChange={() => undefined}
            onFileSelect={setPendingThumbnail}
            disabled={form.formState.isSubmitting}
          />

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register("requires_enrollment")} />
              Requer matrícula
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register("is_published")} />
              Publicado
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Criar curso
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
