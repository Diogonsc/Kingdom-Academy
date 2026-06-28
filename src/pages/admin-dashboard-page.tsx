import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loading } from "@/components/loading";
import { fetchAdminMetrics, type DashboardMetrics } from "@/services/metrics";
import {
  AwardIcon,
  BookUpIcon,
  FileTextIcon,
  TrendingUpIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";

const PIE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];

export function DashboardAdminPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const data = await fetchAdminMetrics();
        setMetrics(data);
        setError(null);
      } catch (err) {
        console.error("Erro ao carregar métricas:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar as métricas.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadMetrics();
  }, []);

  if (loading) {
    return <Loading message="Carregando métricas..." />;
  }

  if (error || !metrics) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <h1 className="text-2xl font-bold">Dashboard Admin</h1>
        <p className="text-sm text-destructive">
          {error ?? "Não foi possível carregar as métricas."}
        </p>
      </div>
    );
  }

  const summaryCards = [
    {
      title: "Total de Cursos",
      description: "Cursos cadastrados na plataforma",
      icon: <BookUpIcon className="size-4 text-primary" />,
      value: metrics.totalCourses,
    },
    {
      title: "Total de Alunos",
      description: "Membros registrados",
      icon: <UsersIcon className="size-4 text-primary" />,
      value: metrics.totalUsers,
    },
    {
      title: "Total de Inscrições",
      description: "Matrículas realizadas",
      icon: <FileTextIcon className="size-4 text-primary" />,
      value: metrics.totalEnrollments,
    },
    {
      title: "Total de Certificados",
      description: "Certificados emitidos",
      icon: <AwardIcon className="size-4 text-primary" />,
      value: metrics.totalCertificates,
    },
    {
      title: "Novos membros esta semana",
      description: "Cadastros nos últimos 7 dias",
      icon: <UserPlusIcon className="size-4 text-primary" />,
      value: metrics.newMembersThisWeek,
    },
    {
      title: "Taxa de conclusão",
      description: "Certificados / matrículas aprovadas",
      icon: <TrendingUpIcon className="size-4 text-primary" />,
      value: `${metrics.courseCompletionRate}%`,
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <h1 className="text-2xl font-bold">Dashboard Admin</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {summaryCards.map((card) => (
          <Card
            key={card.title}
            className="transition-all duration-300 hover:bg-primary/5 hover:ring-2 hover:ring-primary/45 hover:shadow-md dark:hover:ring-primary/65"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {card.icon}
                {card.title}
              </CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Matrículas por mês</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.enrollmentsByMonth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" className="text-xs" />
                <YAxis allowDecimals={false} className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.5rem",
                  }}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.label ?? ""
                  }
                />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status das matrículas</CardTitle>
            <CardDescription>Distribuição por status</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.enrollmentStatusDistribution}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(props) => {
                    const entry = props.payload as { label?: string; count?: number };
                    return `${entry.label ?? ""}: ${entry.count ?? 0}`;
                  }}
                >
                  {metrics.enrollmentStatusDistribution.map((_, index) => (
                    <Cell
                      key={index}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.5rem",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
