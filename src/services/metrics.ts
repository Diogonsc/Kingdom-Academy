import { supabase } from "@/lib/supabase";
import type { EnrollmentStatus } from "@/types/database";

export type DashboardMetrics = {
  totalCourses: number;
  totalUsers: number;
  totalEnrollments: number;
  totalCertificates: number;
  newMembersThisWeek: number;
  courseCompletionRate: number;
  enrollmentsByMonth: { month: string; label: string; count: number }[];
  enrollmentStatusDistribution: {
    status: EnrollmentStatus;
    label: string;
    count: number;
  }[];
};

export async function fetchAdminMetrics(): Promise<DashboardMetrics> {
  const { data, error } = await supabase.rpc("get_admin_dashboard_metrics");

  if (error) {
    throw new Error(error.message);
  }

  if (!data || typeof data !== "object") {
    throw new Error("Métricas do dashboard indisponíveis.");
  }

  return data as DashboardMetrics;
}
