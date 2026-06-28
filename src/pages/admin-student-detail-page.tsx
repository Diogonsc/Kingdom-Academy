import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Loading } from "@/components/loading";
import { ProgressBar } from "@/components/progress-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { fetchStudentAnalytics, type StudentAnalytics } from "@/services/analytics";

export function AdminStudentDetailPage() {
  const { userId } = useParams();
  const [data, setData] = useState<StudentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    async function load(id: string) {
      const analytics = await fetchStudentAnalytics(id);
      setData(analytics);
      setLoading(false);
    }

    void load(userId);
  }, [userId]);

  if (loading) {
    return <Loading message="Carregando analytics do aluno..." />;
  }

  if (!data) {
    return (
      <div className="p-4 text-muted-foreground">Aluno não encontrado.</div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/membros">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{data.profile.name}</h1>
          <p className="text-sm text-muted-foreground">{data.profile.email}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cursos matriculados</CardDescription>
            <CardTitle className="text-2xl">{data.courses.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Certificados</CardDescription>
            <CardTitle className="text-2xl">{data.certificates.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Última atividade</CardDescription>
            <CardTitle className="text-base">
              {data.lastActivity
                ? new Date(data.lastActivity).toLocaleDateString("pt-BR")
                : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progresso nos cursos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.courses.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum curso matriculado.</p>
          ) : (
            data.courses.map((course) => (
              <div key={course.id} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{course.title}</span>
                  <Badge variant={course.isCompleted ? "default" : "secondary"}>
                    {course.isCompleted
                      ? "Concluído"
                      : `${course.progressPercent}%`}
                  </Badge>
                </div>
                <ProgressBar value={course.progressPercent} />
                <p className="text-xs text-muted-foreground">
                  {course.completedLessons} de {course.totalLessons} aulas
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Provas realizadas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Curso</TableHead>
                <TableHead>Prova</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Nota</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.examAttempts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    Nenhuma prova realizada.
                  </TableCell>
                </TableRow>
              ) : (
                data.examAttempts.map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell>{attempt.course_title}</TableCell>
                    <TableCell>{attempt.exam_title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{attempt.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {attempt.final_score !== null
                        ? `${Math.round(attempt.final_score)}%`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
