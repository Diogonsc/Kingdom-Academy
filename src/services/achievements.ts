import { supabase } from "@/lib/supabase";

export type AchievementType =
  | "first_course"
  | "first_exam_passed"
  | "three_courses"
  | "all_exams_passed";

export type Achievement = {
  id: string;
  user_id: string;
  type: AchievementType;
  earned_at: string;
};

export const ACHIEVEMENT_LABELS: Record<
  AchievementType,
  { title: string; description: string }
> = {
  first_course: {
    title: "Primeiro Passo",
    description: "Concluiu seu primeiro curso na plataforma.",
  },
  first_exam_passed: {
    title: "Aprovado!",
    description: "Passou na sua primeira prova.",
  },
  three_courses: {
    title: "Estudioso",
    description: "Concluiu 3 cursos na Kingdom Academy.",
  },
  all_exams_passed: {
    title: "Excelência",
    description: "Aprovou em todas as provas disponíveis.",
  },
};

export async function fetchUserAchievements(
  userId?: string,
): Promise<Achievement[]> {
  let targetId = userId;

  if (!targetId) {
    const { data } = await supabase.auth.getUser();
    targetId = data.user?.id ?? undefined;
  }

  if (!targetId) return [];

  const { data, error } = await supabase
    .from("achievements")
    .select("*")
    .eq("user_id", targetId)
    .order("earned_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Achievement[];
}

async function awardAchievement(
  userId: string,
  type: AchievementType,
): Promise<Achievement | null> {
  const { data, error } = await supabase
    .from("achievements")
    .insert({ user_id: userId, type })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") return null;
    throw new Error(error.message);
  }

  return data as Achievement;
}

export async function checkCourseAchievements(userId: string): Promise<Achievement[]> {
  const awarded: Achievement[] = [];

  const { count: certCount } = await supabase
    .from("certificates")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const total = certCount ?? 0;

  if (total >= 1) {
    const a = await awardAchievement(userId, "first_course");
    if (a) awarded.push(a);
  }

  if (total >= 3) {
    const a = await awardAchievement(userId, "three_courses");
    if (a) awarded.push(a);
  }

  return awarded;
}

export async function checkExamAchievements(userId: string): Promise<Achievement[]> {
  const awarded: Achievement[] = [];

  const { count: passedCount } = await supabase
    .from("exam_attempts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("passed", true);

  if ((passedCount ?? 0) >= 1) {
    const a = await awardAchievement(userId, "first_exam_passed");
    if (a) awarded.push(a);
  }

  const { data: publishedExams } = await supabase
    .from("exams")
    .select("id")
    .eq("is_published", true);

  const examIds = (publishedExams ?? []).map((e) => e.id as string);

  if (examIds.length > 0) {
    const { data: passedAttempts } = await supabase
      .from("exam_attempts")
      .select("exam_id")
      .eq("user_id", userId)
      .eq("passed", true)
      .in("exam_id", examIds);

    const passedExamIds = new Set(
      (passedAttempts ?? []).map((a) => a.exam_id as string),
    );

    if (passedExamIds.size >= examIds.length) {
      const a = await awardAchievement(userId, "all_exams_passed");
      if (a) awarded.push(a);
    }
  }

  return awarded;
}
