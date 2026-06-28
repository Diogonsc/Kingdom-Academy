import { supabase } from "@/lib/supabase";
import type { Certificate, CourseWithProgress, Profile } from "@/types/database";
import type { ExamAttempt } from "@/types/exam";

export type StudentAnalytics = {
  profile: Profile;
  courses: (CourseWithProgress & { completedLessons: number; totalLessons: number })[];
  examAttempts: (ExamAttempt & { exam_title: string; course_title: string })[];
  certificates: (Certificate & { course_title: string })[];
  lastActivity: string | null;
};

export async function fetchStudentAnalytics(
  userId: string,
): Promise<StudentAnalytics | null> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) throw new Error(profileError.message);
  if (!profile) return null;

  const [
    enrollmentsResult,
    progressResult,
    lessonsResult,
    certificatesResult,
    attemptsResult,
  ] = await Promise.all([
    supabase
      .from("enrollments")
      .select("*, course:courses(*)")
      .eq("user_id", userId)
      .eq("status", "approved"),
    supabase
      .from("lesson_progress")
      .select("lesson_id, is_completed, completed_at")
      .eq("user_id", userId)
      .eq("is_completed", true),
    supabase.from("lessons").select("id, course_id"),
    supabase
      .from("certificates")
      .select("*, course:courses(title)")
      .eq("user_id", userId),
    supabase
      .from("exam_attempts")
      .select("*, exam:exams(title, course_id, course:courses(title))")
      .eq("user_id", userId)
      .order("started_at", { ascending: false }),
  ]);

  const completedLessonIds = new Set(
    (progressResult.data ?? []).map((p) => p.lesson_id as string),
  );

  const lessonsByCourse = new Map<string, number>();
  for (const lesson of lessonsResult.data ?? []) {
    const courseId = lesson.course_id as string;
    lessonsByCourse.set(courseId, (lessonsByCourse.get(courseId) ?? 0) + 1);
  }

  const courses = (enrollmentsResult.data ?? []).map((row) => {
    const course = row.course as CourseWithProgress;
    const totalLessons = lessonsByCourse.get(course.id) ?? 0;
    const courseLessonIds = (lessonsResult.data ?? [])
      .filter((l) => l.course_id === course.id)
      .map((l) => l.id as string);
    const completedLessons = courseLessonIds.filter((id) =>
      completedLessonIds.has(id),
    ).length;

    const cert = (certificatesResult.data ?? []).find(
      (c) => c.course_id === course.id,
    );

    return {
      ...course,
      isEnrolled: true,
      enrollmentStatus: row.status,
      enrolledAt: row.enrolled_at,
      isCompleted: Boolean(cert),
      progressPercent:
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0,
      completedLessons,
      totalLessons,
    };
  });

  const examAttempts = (attemptsResult.data ?? []).map((row) => {
    const exam = row.exam as {
      title: string;
      course: { title: string } | { title: string }[];
    };
    const courseTitle = Array.isArray(exam.course)
      ? exam.course[0]?.title
      : exam.course?.title;

    const { exam: _exam, ...attempt } = row;
    return {
      ...(attempt as ExamAttempt),
      exam_title: exam.title,
      course_title: courseTitle ?? "—",
    };
  });

  const certificates = (certificatesResult.data ?? []).map((row) => {
    const course = row.course as { title: string };
    const { course: _c, ...cert } = row;
    return {
      ...(cert as Certificate),
      course_title: course.title,
    };
  });

  const activityDates: string[] = [
    ...(progressResult.data ?? []).map((p) => p.completed_at as string),
    ...examAttempts.map((a) => a.submitted_at ?? a.started_at),
    ...certificates.map((c) => c.issued_at),
  ].filter(Boolean);

  const lastActivity =
    activityDates.length > 0
      ? activityDates.sort(
          (a, b) => new Date(b).getTime() - new Date(a).getTime(),
        )[0]
      : null;

  return {
    profile: profile as Profile,
    courses,
    examAttempts,
    certificates,
    lastActivity,
  };
}
