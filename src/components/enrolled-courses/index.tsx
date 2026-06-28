import { ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/progress-bar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { CourseWithProgress } from "@/types/database";

type EnrolledCoursesProps = {
  courses: CourseWithProgress[];
  className?: string;
};

function formatStartDate(course: CourseWithProgress): string {
  const date = course.enrolledAt ?? course.created_at;
  return new Date(date).toLocaleDateString("pt-BR");
}

function getStatusLabel(course: CourseWithProgress): string {
  if (course.isCompleted) return "Concluído";
  if (course.enrollmentStatus === "pending") return "Pendente";
  if (course.progressPercent > 0) return "Em andamento";
  return "Matriculado";
}

function getProgressLabel(course: CourseWithProgress): string {
  if (course.isCompleted) return "100%";
  return `${course.progressPercent}%`;
}

export function EnrolledCourses({ courses, className }: EnrolledCoursesProps) {
  const navigate = useNavigate();

  if (courses.length === 0) return null;

  return (
    <Card className={cn("gap-0 py-0", className)}>
      <CardHeader className="border-b border-border px-6 py-5">
        <CardTitle className="text-base font-bold tracking-wide uppercase">
          Cursos matriculados
        </CardTitle>
        <CardDescription>
          Acompanhe seus cursos, progresso e acesse as aulas disponíveis.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-0 pb-0">
        <div className="max-h-72 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-6 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Cursos atuais
                </TableHead>
                <TableHead className="px-4 text-center text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Início
                </TableHead>
                <TableHead className="px-6 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Progresso
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow
                  key={course.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/curso/${course.slug}`)}
                >
                  <TableCell className="px-6 py-4">
                    <div className="space-y-1.5">
                      <p
                        className="max-w-[280px] truncate text-sm font-semibold uppercase sm:max-w-md"
                        title={course.title}
                      >
                        {course.title}
                      </p>
                      <Badge
                        variant="outline"
                        className="border-primary/30 bg-primary/10 text-[10px] font-semibold tracking-wide text-primary uppercase"
                      >
                        {getStatusLabel(course)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 text-center">
                    <Badge className="rounded-md px-2.5 py-0.5 text-xs font-medium">
                      {formatStartDate(course)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 text-right">
                    <div className="ml-auto flex max-w-[120px] flex-col items-end gap-1">
                      <span className="text-sm font-medium text-muted-foreground">
                        {getProgressLabel(course)}
                      </span>
                      {!course.isCompleted && course.progressPercent > 0 ? (
                        <ProgressBar value={course.progressPercent} className="h-1.5" />
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="border-t border-border px-6 py-4 text-center">
          <Link
            to="/meus-cursos"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            Ir para lista de cursos
            <span className="flex size-5 items-center justify-center rounded-full border border-primary/30">
              <ArrowRight className="size-3" />
            </span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
