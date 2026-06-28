import { supabase } from "@/lib/supabase";
import { sendNotification } from "@/services/notifications";
import type { EnrollmentStatus, EnrollmentWithDetails } from "@/types/database";

export async function fetchEnrollmentsAdmin(
  status?: EnrollmentStatus,
): Promise<EnrollmentWithDetails[]> {
  let query = supabase
    .from("enrollments")
    .select(
      "*, profile:profiles(id, name, email), course:courses(id, title, slug)",
    )
    .order("enrolled_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return (data ?? []) as EnrollmentWithDetails[];
}

export async function updateEnrollmentStatus(
  enrollmentId: string,
  status: EnrollmentStatus,
): Promise<void> {
  const { error } = await supabase
    .from("enrollments")
    .update({ status })
    .eq("id", enrollmentId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function approveEnrollment(enrollmentId: string): Promise<void> {
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("user_id, course:courses(title, slug)")
    .eq("id", enrollmentId)
    .single();

  await updateEnrollmentStatus(enrollmentId, "approved");

  if (enrollment) {
    const courseRaw = enrollment.course;
    const course = (Array.isArray(courseRaw) ? courseRaw[0] : courseRaw) as {
      title: string;
      slug: string;
    };
    await sendNotification(enrollment.user_id as string, {
      type: "enrollment_approved",
      title: "Matrícula aprovada!",
      message: `Sua matrícula no curso "${course.title}" foi aprovada. Bons estudos!`,
      link: `/curso/${course.slug}`,
    });
  }
}

export async function rejectEnrollment(enrollmentId: string): Promise<void> {
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("user_id, course:courses(title)")
    .eq("id", enrollmentId)
    .single();

  await updateEnrollmentStatus(enrollmentId, "rejected");

  if (enrollment) {
    const courseRaw = enrollment.course;
    const course = (Array.isArray(courseRaw) ? courseRaw[0] : courseRaw) as {
      title: string;
    };
    await sendNotification(enrollment.user_id as string, {
      type: "enrollment_rejected",
      title: "Matrícula não aprovada",
      message: `Sua solicitação para o curso "${course.title}" não foi aprovada.`,
      link: "/meus-cursos",
    });
  }
}

export async function fetchEnrollmentsAdminPaginated(options: {
  status?: EnrollmentStatus;
  page: number;
  pageSize: number;
}): Promise<{ data: EnrollmentWithDetails[]; total: number }> {
  const { status, page, pageSize } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("enrollments")
    .select(
      "*, profile:profiles(id, name, email), course:courses(id, title, slug)",
      { count: "exact" },
    )
    .order("enrolled_at", { ascending: false })
    .range(from, to);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);

  return {
    data: (data ?? []) as EnrollmentWithDetails[],
    total: count ?? 0,
  };
}

export async function fetchPendingEnrollmentsCount(): Promise<number> {
  const { count, error } = await supabase
    .from("enrollments")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) throw new Error(error.message);

  return count ?? 0;
}
