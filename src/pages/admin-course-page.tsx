import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import defaultThumbnail from "@/assets/hero.png";
import { NewCourseModal } from "@/components/admin/new-course-modal";
import { Loading } from "@/components/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  deleteCourse,
  fetchAllCoursesAdmin,
  toggleCoursePublished,
} from "@/services/courses";
import type { CourseWithProgress } from "@/types/database";

const PAGE_SIZE = 8;

type PublishFilter = "all" | "published" | "draft";
type SortOption = "title" | "recent" | "lessons" | "enrollments";

export function CourseAdminPage() {
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [publishFilter, setPublishFilter] = useState<PublishFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [courseToDelete, setCourseToDelete] = useState<CourseWithProgress | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [newCourseOpen, setNewCourseOpen] = useState(false);

  async function loadCourses() {
    setLoading(true);
    const data = await fetchAllCoursesAdmin();
    setCourses(data);
    setLoading(false);
  }

  useEffect(() => {
    void loadCourses();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, publishFilter, sortBy]);

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();

    let result = courses.filter((course) => {
      const matchesSearch =
        !query || course.title.toLowerCase().includes(query);
      const matchesPublish =
        publishFilter === "all" ||
        (publishFilter === "published" && course.is_published) ||
        (publishFilter === "draft" && !course.is_published);

      return matchesSearch && matchesPublish;
    });

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title, "pt-BR");
        case "lessons":
          return (b.lessonCount ?? 0) - (a.lessonCount ?? 0);
        case "enrollments":
          return (b.enrollmentCount ?? 0) - (a.enrollmentCount ?? 0);
        case "recent":
        default:
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
      }
    });

    return result;
  }, [courses, search, publishFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / PAGE_SIZE));
  const paginatedCourses = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredCourses.slice(start, start + PAGE_SIZE);
  }, [filteredCourses, page]);

  async function handleTogglePublished(course: CourseWithProgress) {
    try {
      await toggleCoursePublished(course.id, !course.is_published);
      toast.success(
        course.is_published ? "Curso despublicado" : "Curso publicado com sucesso",
      );
      await loadCourses();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar publicação",
      );
    }
  }

  async function handleDeleteCourse() {
    if (!courseToDelete) return;

    setDeleting(true);

    try {
      await deleteCourse(courseToDelete.id);
      toast.success("Curso excluído com sucesso");
      setCourseToDelete(null);
      await loadCourses();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir curso");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <Loading message="Carregando cursos..." />;
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Cursos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os cursos da plataforma.
          </p>
        </div>
        <Button type="button" onClick={() => setNewCourseOpen(true)}>
          <Plus className="size-4" />
          Novo Curso
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por título"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={publishFilter}
          onValueChange={(value) => setPublishFilter(value as PublishFilter)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="published">Publicado</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sortBy}
          onValueChange={(value) => setSortBy(value as SortOption)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Mais recente</SelectItem>
            <SelectItem value="title">Título (A-Z)</SelectItem>
            <SelectItem value="lessons">Mais aulas</SelectItem>
            <SelectItem value="enrollments">Mais matrículas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thumbnail</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aulas</TableHead>
              <TableHead>Matrículas</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCourses.map((course) => (
              <TableRow key={course.id}>
                <TableCell>
                  <img
                    src={course.thumbnail_url ?? defaultThumbnail}
                    alt={course.title}
                    className="size-12 rounded-md object-cover"
                  />
                </TableCell>
                <TableCell className="font-medium">{course.title}</TableCell>
                <TableCell>
                  <Badge variant={course.is_published ? "default" : "secondary"}>
                    {course.is_published ? "Publicado" : "Rascunho"}
                  </Badge>
                </TableCell>
                <TableCell>{course.lessonCount ?? 0}</TableCell>
                <TableCell>{course.enrollmentCount ?? 0}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/admin/cursos/${course.id}/editar`}>
                        <Pencil className="size-4" />
                        Editar
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleTogglePublished(course)}
                    >
                      {course.is_published ? "Despublicar" : "Publicar"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setCourseToDelete(course)}
                    >
                      <Trash2 className="size-4" />
                      Excluir
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={filteredCourses.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

      <NewCourseModal
        open={newCourseOpen}
        onOpenChange={setNewCourseOpen}
        onCreated={() => void loadCourses()}
      />

      <Dialog
        open={Boolean(courseToDelete)}
        onOpenChange={(open) => {
          if (!open) setCourseToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o curso &quot;{courseToDelete?.title}
              &quot;? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCourseToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={() => void handleDeleteCourse()}
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
