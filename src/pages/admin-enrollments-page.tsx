import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loading } from "@/components/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  approveEnrollment,
  fetchEnrollmentsAdminPaginated,
  rejectEnrollment,
} from "@/services/enrollments";
import type { EnrollmentStatus, EnrollmentWithDetails } from "@/types/database";

const PAGE_SIZE = 15;

const statusLabels: Record<EnrollmentStatus, string> = {
  pending: "Pendente",
  approved: "Aprovada",
  rejected: "Rejeitada",
};

const statusVariants: Record<
  EnrollmentStatus,
  "default" | "secondary" | "destructive"
> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

export function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<EnrollmentStatus | "all">(
    "pending",
  );
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function loadEnrollments() {
    setLoading(true);

    const result = await fetchEnrollmentsAdminPaginated({
      status: statusFilter === "all" ? undefined : statusFilter,
      page,
      pageSize: PAGE_SIZE,
    });

    setEnrollments(result.data);
    setTotal(result.total);
    setLoading(false);
  }

  useEffect(() => {
    void loadEnrollments();
  }, [statusFilter, page]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pendingOnPage = enrollments.filter((item) => item.status === "pending").length;

  async function handleApprove(enrollment: EnrollmentWithDetails) {
    setProcessingId(enrollment.id);

    try {
      await approveEnrollment(enrollment.id);
      toast.success(
        `Matrícula de ${enrollment.profile.name} aprovada com sucesso`,
      );
      await loadEnrollments();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao aprovar matrícula",
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(enrollment: EnrollmentWithDetails) {
    setProcessingId(enrollment.id);

    try {
      await rejectEnrollment(enrollment.id);
      toast.success(`Matrícula de ${enrollment.profile.name} rejeitada`);
      await loadEnrollments();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao rejeitar matrícula",
      );
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return <Loading message="Carregando matrículas..." />;
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Matrículas</h1>
          <p className="text-sm text-muted-foreground">
            Aprove ou rejeite solicitações de acesso aos cursos.
          </p>
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as EnrollmentStatus | "all")
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="approved">Aprovadas</SelectItem>
            <SelectItem value="rejected">Rejeitadas</SelectItem>
            <SelectItem value="all">Todas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {statusFilter === "pending" && pendingOnPage > 0 ? (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          {pendingOnPage} solicitação(ões) nesta página aguardando aprovação.
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Curso</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrollments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhuma matrícula encontrada.
                </TableCell>
              </TableRow>
            ) : (
              enrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell className="font-medium">
                    {enrollment.profile.name}
                  </TableCell>
                  <TableCell>{enrollment.profile.email ?? "—"}</TableCell>
                  <TableCell>{enrollment.course.title}</TableCell>
                  <TableCell>
                    {new Date(enrollment.enrolled_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[enrollment.status]}>
                      {statusLabels[enrollment.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {enrollment.status === "pending" ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          disabled={processingId === enrollment.id}
                          onClick={() => void handleApprove(enrollment)}
                        >
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={processingId === enrollment.id}
                          onClick={() => void handleReject(enrollment)}
                        >
                          Rejeitar
                        </Button>
                      </div>
                    ) : (
                      <span className="block text-right text-sm text-muted-foreground">
                        —
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
