import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ClipboardList, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Loading } from "@/components/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  deleteExam,
  fetchAllExamsAdmin,
  updateExam,
} from "@/services/exams";
import type { ExamAdminListItem } from "@/types/exam";

export function ExamAdminPage() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<ExamAdminListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ExamAdminListItem | null>(
    null,
  );
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function loadExams() {
    setLoading(true);
    try {
      const data = await fetchAllExamsAdmin();
      setExams(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao carregar provas",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadExams();
  }, []);

  async function handleTogglePublish(exam: ExamAdminListItem) {
    setProcessingId(exam.id);
    try {
      await updateExam(exam.id, { is_published: !exam.is_published });
      toast.success(
        exam.is_published ? "Prova despublicada" : "Prova publicada",
      );
      await loadExams();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar prova",
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setProcessingId(deleteTarget.id);
    try {
      await deleteExam(deleteTarget.id);
      toast.success("Prova excluída");
      setDeleteTarget(null);
      await loadExams();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao excluir prova",
      );
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return <Loading message="Carregando provas..." />;
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Provas</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie provas, questões e correções.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/provas/nova">
            <Plus className="size-4" />
            Nova Prova
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Curso</TableHead>
              <TableHead>Questões</TableHead>
              <TableHead>Pendentes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhuma prova cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              exams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">{exam.title}</TableCell>
                  <TableCell>{exam.course?.title ?? "—"}</TableCell>
                  <TableCell>{exam.question_count}</TableCell>
                  <TableCell>
                    {exam.submitted_count > 0 ? (
                      <Badge variant="secondary">{exam.submitted_count}</Badge>
                    ) : (
                      "0"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={exam.is_published ? "default" : "outline"}>
                      {exam.is_published ? "Publicada" : "Rascunho"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigate(`/admin/provas/${exam.id}/editar`)
                        }
                      >
                        <Pencil className="size-3.5" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigate(`/admin/provas/${exam.id}/correcoes`)
                        }
                      >
                        <ClipboardList className="size-3.5" />
                        Corrigir
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={processingId === exam.id}
                        onClick={() => void handleTogglePublish(exam)}
                      >
                        {exam.is_published ? "Despublicar" : "Publicar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteTarget(exam)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir prova?</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. A prova &quot;{deleteTarget?.title}&quot;
              será removida permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={processingId === deleteTarget?.id}
              onClick={() => void handleDelete()}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
