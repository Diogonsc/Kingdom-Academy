import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpenIcon, Search } from "lucide-react";
import { CardCourse } from "@/components/card-course";
import { toCardCourse } from "@/components/card-course/schema";
import { CardCourseSkeletonGrid } from "@/components/card-skeletons";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMyCourses } from "@/hooks/use-my-courses";

type StatusFilter = "all" | "in_progress" | "completed" | "available";

export function MyCoursesPage() {
  const { data: courses, loading, refetch } = useMyCourses();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesSearch =
        !query ||
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "in_progress" &&
          !course.isCompleted &&
          course.isEnrolled) ||
        (statusFilter === "completed" && course.isCompleted) ||
        (statusFilter === "available" &&
          !course.isCompleted &&
          !course.isEnrolled &&
          course.enrollmentStatus !== "pending");

      return matchesSearch && matchesStatus;
    });
  }, [courses, search, statusFilter]);

  if (loading) {
    return (
      <div className="p-4">
        <CardCourseSkeletonGrid count={4} />
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          icon={<BookOpenIcon className="size-6" />}
          title="Nenhum curso encontrado"
          description="Você ainda não iniciou nenhum curso. Explore a plataforma e comece sua jornada."
          action={
            <Button asChild>
              <Link to="/dashboard">Explorar cursos</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const pending = filteredCourses.filter(
    (course) => !course.isCompleted && course.enrollmentStatus === "pending",
  );
  const inProgress = filteredCourses.filter(
    (course) => !course.isCompleted && course.isEnrolled,
  );
  const completed = filteredCourses.filter((course) => course.isCompleted);

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Meus Cursos</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe seu progresso e retome de onde parou.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou descrição"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as StatusFilter)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="in_progress">Em andamento</SelectItem>
            <SelectItem value="completed">Concluídos</SelectItem>
            <SelectItem value="available">Disponíveis</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredCourses.length === 0 ? (
        <EmptyState
          icon={<BookOpenIcon className="size-6" />}
          title="Nenhum curso encontrado"
          description="Tente ajustar os filtros ou o termo de busca."
        />
      ) : null}

      {pending.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Aguardando aprovação</h2>
          <div className="flex flex-wrap gap-6">
            {pending.map((course) => (
              <CardCourse
                key={course.id}
                course={toCardCourse(course)}
                className="mx-0 w-full max-w-[300px] shrink-0"
                showEnrollmentLock
                onEnrolled={refetch}
              />
            ))}
          </div>
        </section>
      ) : null}

      {inProgress.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Em andamento</h2>
          <div className="flex flex-wrap gap-6">
            {inProgress.map((course) => (
              <div
                key={course.id}
                className="flex w-full shrink-0 flex-col gap-3 sm:w-[300px]"
              >
                <CardCourse
                  course={toCardCourse(course)}
                  className="mx-0 w-full"
                  showEnrollmentLock
                  onEnrolled={refetch}
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {completed.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Cursos concluídos</h2>
          <div className="flex flex-wrap gap-6">
            {completed.map((course) => (
              <CardCourse
                key={course.id}
                course={toCardCourse(course)}
                className="mx-0 w-full max-w-[300px] shrink-0"
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
