import { supabase } from "@/lib/supabase";
import { calculateCourseDurationHours } from "@/lib/course-duration";
import { extractYoutubeVideoId } from "@/lib/youtube";
import { checkCourseAchievements } from "@/services/achievements";
import type {
  Certificate,
  CertificateWithCourse,
  Course,
  CourseModule,
  CourseWithProgress,
  EnrollmentStatus,
  Lesson,
} from "@/types/database";

export function slugifyCourse(title: string) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

function mapCourseRow(row: Course): Course {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    thumbnail_url: row.thumbnail_url,
    is_published: row.is_published,
    requires_enrollment: row.requires_enrollment,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function buildCoursesWithProgress(
  courses: Course[],
  userId: string | null,
): Promise<CourseWithProgress[]> {
  if (courses.length === 0) return [];

  const courseIds = courses.map((course) => course.id);

  const [{ data: lessons }, { data: enrollments }, { data: progress }, { data: certificates }, { data: profile }] =
    await Promise.all([
      supabase
        .from("lessons")
        .select("id, course_id")
        .in("course_id", courseIds),
      userId
        ? supabase
            .from("enrollments")
            .select("course_id, status, enrolled_at")
            .eq("user_id", userId)
        : Promise.resolve({
            data: [] as {
              course_id: string;
              status: EnrollmentStatus;
              enrolled_at: string;
            }[],
          }),
      userId
        ? supabase
            .from("lesson_progress")
            .select("lesson_id, is_completed")
            .eq("user_id", userId)
            .eq("is_completed", true)
        : Promise.resolve({ data: [] as { lesson_id: string; is_completed: boolean }[] }),
      userId
        ? supabase.from("certificates").select("course_id").eq("user_id", userId)
        : Promise.resolve({ data: [] as { course_id: string }[] }),
      userId
        ? supabase.from("profiles").select("role").eq("id", userId).maybeSingle()
        : Promise.resolve({ data: null as { role: string } | null }),
    ]);

  const isAdmin = profile?.role === "admin";

  const lessonsByCourse = new Map<string, string[]>();
  for (const lesson of lessons ?? []) {
    const list = lessonsByCourse.get(lesson.course_id) ?? [];
    list.push(lesson.id);
    lessonsByCourse.set(lesson.course_id, list);
  }

  const enrollmentStatusByCourse = new Map<string, EnrollmentStatus>();
  const enrolledAtByCourse = new Map<string, string>();
  for (const enrollment of enrollments ?? []) {
    enrollmentStatusByCourse.set(enrollment.course_id, enrollment.status);
    enrolledAtByCourse.set(enrollment.course_id, enrollment.enrolled_at);
  }

  const approvedCourseIds = new Set(
    (enrollments ?? [])
      .filter((enrollment) => enrollment.status === "approved")
      .map((enrollment) => enrollment.course_id),
  );
  const completedLessonIds = new Set(
    (progress ?? []).filter((item) => item.is_completed).map((item) => item.lesson_id),
  );
  const certifiedCourseIds = new Set(
    (certificates ?? []).map((certificate) => certificate.course_id),
  );

  return courses.map((course) => {
    const courseLessonIds = lessonsByCourse.get(course.id) ?? [];
    const totalLessons = courseLessonIds.length;
    const completedLessons = courseLessonIds.filter((lessonId) =>
      completedLessonIds.has(lessonId),
    ).length;

    const progressPercent =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    const isCompleted =
      certifiedCourseIds.has(course.id) ||
      (totalLessons > 0 && completedLessons === totalLessons);

    const isEnrolled = isAdmin || approvedCourseIds.has(course.id);
    const enrollmentStatus = enrollmentStatusByCourse.get(course.id) ?? null;

    return {
      ...mapCourseRow(course),
      isCompleted,
      progressPercent,
      isEnrolled,
      enrollmentStatus,
      enrolledAt: enrolledAtByCourse.get(course.id) ?? null,
      lessonCount: totalLessons,
    };
  });
}

export async function fetchPublishedCourses(): Promise<CourseWithProgress[]> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return buildCoursesWithProgress((data ?? []) as Course[], userId);
}

export async function fetchCourseBySlug(slug: string): Promise<CourseWithProgress | null> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const [courseWithProgress] = await buildCoursesWithProgress(
    [data as Course],
    userId,
  );

  return courseWithProgress ?? null;
}

export async function fetchCourseById(id: string): Promise<Course | null> {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return mapCourseRow(data as Course);
}

export async function fetchCourseLessons(courseId: string): Promise<Lesson[]> {
  const userId = await getCurrentUserId();

  const { data: lessons, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  if (error) throw new Error(error.message);

  if (!userId || !lessons?.length) {
    return (lessons ?? []) as Lesson[];
  }

  const lessonIds = lessons.map((lesson) => lesson.id);
  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("lesson_id, is_completed")
    .eq("user_id", userId)
    .in("lesson_id", lessonIds);

  const completedIds = new Set(
    (progress ?? [])
      .filter((item) => item.is_completed)
      .map((item) => item.lesson_id),
  );

  return (lessons as Lesson[]).map((lesson) => ({
    ...lesson,
    isCompleted: completedIds.has(lesson.id),
  }));
}

export async function fetchCourseDurationHours(courseId: string): Promise<number> {
  const { data, error } = await supabase
    .from("lessons")
    .select("duration")
    .eq("course_id", courseId);

  if (error) throw new Error(error.message);

  return calculateCourseDurationHours(
    (data ?? []) as { duration: string | null }[],
  );
}

export async function requestCourseEnrollment(courseId: string): Promise<void> {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("Usuário não autenticado");
  }

  const { data: existing, error: fetchError } = await supabase
    .from("enrollments")
    .select("status")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (existing?.status === "approved") {
    throw new Error("Você já está matriculado neste curso");
  }

  if (existing?.status === "pending") {
    throw new Error("Sua solicitação já está aguardando aprovação");
  }

  if (existing?.status === "rejected") {
    const { error } = await supabase
      .from("enrollments")
      .update({
        status: "pending",
        enrolled_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("course_id", courseId);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error } = await supabase.from("enrollments").insert({
    user_id: userId,
    course_id: courseId,
    status: "pending",
  });

  if (error) {
    throw new Error(error.message);
  }
}

/** @deprecated Use requestCourseEnrollment */
export async function enrollInCourse(courseId: string): Promise<void> {
  return requestCourseEnrollment(courseId);
}

export async function markLessonComplete(lessonId: string): Promise<void> {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("Usuário não autenticado");
  }

  const { error } = await supabase.from("lesson_progress").upsert(
    {
      user_id: userId,
      lesson_id: lessonId,
      is_completed: true,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchMyCourses(): Promise<CourseWithProgress[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const [{ data: enrollments }, { data: certificates }, { data: progress }] =
    await Promise.all([
      supabase
        .from("enrollments")
        .select("course_id, status")
        .eq("user_id", userId)
        .in("status", ["approved", "pending"]),
      supabase.from("certificates").select("course_id").eq("user_id", userId),
      supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", userId)
        .eq("is_completed", true),
    ]);

  const lessonIds = (progress ?? []).map((item) => item.lesson_id);
  let progressCourseIds: string[] = [];

  if (lessonIds.length > 0) {
    const { data: progressLessons, error: progressLessonsError } = await supabase
      .from("lessons")
      .select("course_id")
      .in("id", lessonIds);

    if (progressLessonsError) {
      throw new Error(progressLessonsError.message);
    }

    progressCourseIds = [
      ...new Set((progressLessons ?? []).map((lesson) => lesson.course_id)),
    ];
  }

  const courseIds = new Set<string>();

  for (const enrollment of enrollments ?? []) {
    courseIds.add(enrollment.course_id);
  }

  for (const certificate of certificates ?? []) {
    courseIds.add(certificate.course_id);
  }

  for (const courseId of progressCourseIds) {
    courseIds.add(courseId);
  }

  if (courseIds.size === 0) return [];

  const { data: courses, error } = await supabase
    .from("courses")
    .select("*")
    .in("id", Array.from(courseIds))
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);

  return buildCoursesWithProgress((courses ?? []) as Course[], userId);
}

export async function fetchMyCertificates(): Promise<CertificateWithCourse[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("certificates")
    .select("*, course:courses(id, title, slug, thumbnail_url)")
    .eq("user_id", userId)
    .order("issued_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []) as CertificateWithCourse[];
}

export async function issueCertificate(courseId: string): Promise<Certificate> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Usuário não autenticado");
  }

  const { data, error } = await supabase
    .from("certificates")
    .upsert(
      {
        user_id: userId,
        course_id: courseId,
      },
      { onConflict: "user_id,course_id" },
    )
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  await checkCourseAchievements(userId);

  return data as Certificate;
}

export async function fetchAllCoursesAdmin(): Promise<CourseWithProgress[]> {
  const { data: courses, error } = await supabase
    .from("courses")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);

  const courseIds = (courses ?? []).map((course) => course.id);

  const [{ data: lessons }, { data: enrollments }] = await Promise.all([
    supabase.from("lessons").select("id, course_id").in("course_id", courseIds),
    supabase.from("enrollments").select("course_id, status"),
  ]);

  const lessonCountByCourse = new Map<string, number>();
  for (const lesson of lessons ?? []) {
    lessonCountByCourse.set(
      lesson.course_id,
      (lessonCountByCourse.get(lesson.course_id) ?? 0) + 1,
    );
  }

  const enrollmentCountByCourse = new Map<string, number>();
  for (const enrollment of enrollments ?? []) {
    if (enrollment.status !== "approved") continue;
    enrollmentCountByCourse.set(
      enrollment.course_id,
      (enrollmentCountByCourse.get(enrollment.course_id) ?? 0) + 1,
    );
  }

  return ((courses ?? []) as Course[]).map((course) => ({
    ...mapCourseRow(course),
    isCompleted: false,
    progressPercent: 0,
    isEnrolled: false,
    enrollmentStatus: null,
    enrolledAt: null,
    lessonCount: lessonCountByCourse.get(course.id) ?? 0,
    enrollmentCount: enrollmentCountByCourse.get(course.id) ?? 0,
  }));
}

export async function deleteCourse(courseId: string): Promise<void> {
  const { error } = await supabase.from("courses").delete().eq("id", courseId);
  if (error) throw new Error(error.message);
}

export async function toggleCoursePublished(
  courseId: string,
  isPublished: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("courses")
    .update({ is_published: isPublished, updated_at: new Date().toISOString() })
    .eq("id", courseId);

  if (error) throw new Error(error.message);
}

export type CourseFormData = {
  title: string;
  description: string;
  thumbnail_url?: string;
  requires_enrollment: boolean;
  is_published: boolean;
};

export async function createCourse(data: CourseFormData): Promise<Course> {
  const slug = slugifyCourse(data.title);

  const { data: course, error } = await supabase
    .from("courses")
    .insert({
      title: data.title,
      slug,
      description: data.description,
      thumbnail_url: data.thumbnail_url || null,
      requires_enrollment: data.requires_enrollment,
      is_published: data.is_published,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return mapCourseRow(course as Course);
}

export async function updateCourse(
  courseId: string,
  data: CourseFormData,
): Promise<Course> {
  const { data: course, error } = await supabase
    .from("courses")
    .update({
      title: data.title,
      slug: slugifyCourse(data.title),
      description: data.description,
      thumbnail_url: data.thumbnail_url || null,
      requires_enrollment: data.requires_enrollment,
      is_published: data.is_published,
      updated_at: new Date().toISOString(),
    })
    .eq("id", courseId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return mapCourseRow(course as Course);
}

export type LessonFormData = {
  title: string;
  description?: string;
  video_id?: string;
  duration?: string;
  module_id?: string | null;
};

export async function createLesson(
  courseId: string,
  data: LessonFormData,
  orderIndex: number,
): Promise<Lesson> {
  const normalizedVideoId = data.video_id
    ? extractYoutubeVideoId(data.video_id)
    : null;

  const { data: lesson, error } = await supabase
    .from("lessons")
    .insert({
      course_id: courseId,
      module_id: data.module_id ?? null,
      title: data.title,
      description: data.description || null,
      video_id: normalizedVideoId,
      duration: data.duration || null,
      order_index: orderIndex,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return lesson as Lesson;
}

export async function updateLesson(
  lessonId: string,
  data: LessonFormData,
): Promise<Lesson> {
  const normalizedVideoId = data.video_id
    ? extractYoutubeVideoId(data.video_id)
    : null;

  const { data: lesson, error } = await supabase
    .from("lessons")
    .update({
      title: data.title,
      description: data.description || null,
      video_id: normalizedVideoId,
      duration: data.duration || null,
      module_id: data.module_id ?? null,
    })
    .eq("id", lessonId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return lesson as Lesson;
}

export async function deleteLesson(lessonId: string): Promise<void> {
  const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
  if (error) throw new Error(error.message);
}

export async function reorderLesson(
  lessonId: string,
  newOrderIndex: number,
): Promise<void> {
  const { error } = await supabase
    .from("lessons")
    .update({ order_index: newOrderIndex })
    .eq("id", lessonId);

  if (error) throw new Error(error.message);
}

// ── Módulos de curso ───────────────────────────────────────────

function isMissingSchemaError(error: { code?: string; message?: string }): boolean {
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    (error.message?.includes("schema cache") ?? false) ||
    (error.message?.includes("does not exist") ?? false)
  );
}

export async function fetchCourseModules(courseId: string): Promise<CourseModule[]> {
  try {
    const { data, error } = await supabase
      .from("course_modules")
      .select("*")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });

    if (error) {
      if (isMissingSchemaError(error)) return [];
      throw new Error(error.message);
    }

    return (data ?? []) as CourseModule[];
  } catch (error) {
    if (error instanceof Error && isMissingSchemaError(error)) return [];
    console.error("Erro ao buscar módulos:", error);
    throw error instanceof Error ? error : new Error("Erro ao buscar módulos.");
  }
}

export async function createModule(
  courseId: string,
  title: string,
  orderIndex: number,
): Promise<CourseModule> {
  const { data, error } = await supabase
    .from("course_modules")
    .insert({ course_id: courseId, title, order_index: orderIndex })
    .select("*")
    .single();

  if (error) {
    if (isMissingSchemaError(error)) {
      throw new Error(
        "Módulos não disponíveis. Execute a migração supabase/p4-features.sql no Supabase.",
      );
    }
    throw new Error(error.message);
  }
  return data as CourseModule;
}

export async function deleteModule(moduleId: string): Promise<void> {
  const { error } = await supabase.from("course_modules").delete().eq("id", moduleId);
  if (error) throw new Error(error.message);
}

export async function reorderModule(
  moduleId: string,
  orderIndex: number,
): Promise<void> {
  const { error } = await supabase
    .from("course_modules")
    .update({ order_index: orderIndex })
    .eq("id", moduleId);

  if (error) throw new Error(error.message);
}
