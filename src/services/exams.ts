import { supabase } from "@/lib/supabase";
import { checkExamAchievements } from "@/services/achievements";
import { sendNotification } from "@/services/notifications";
import { fetchPublishedCourses } from "@/services/courses";
import type {
  AttemptWithDetails,
  Exam,
  ExamAdminListItem,
  ExamAnswer,
  ExamAttempt,
  ExamQuestion,
  ExamQuestionOption,
  ExamWithAttempt,
  StudentExamItem,
} from "@/types/exam";

async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

function buildExamWithAttempts(
  exam: Exam,
  attempts: ExamAttempt[],
): ExamWithAttempt {
  const inProgress = attempts.find((a) => a.status === "in_progress") ?? null;
  const finishedAttempts = attempts.filter((a) => a.status !== "in_progress");
  const latest = inProgress ?? attempts[0] ?? null;
  const attemptsUsed = finishedAttempts.length;
  const attemptsRemaining = Math.max(0, exam.max_attempts - attemptsUsed - (inProgress ? 1 : 0));
  const canStartNew = !inProgress && attemptsUsed < exam.max_attempts;

  return {
    ...exam,
    attempt: latest,
    attemptHistory: attempts,
    attemptsUsed,
    attemptsRemaining,
    canStartNew,
  };
}

async function fetchUserAttempts(
  examId: string,
  userId: string,
): Promise<ExamAttempt[]> {
  const { data } = await supabase
    .from("exam_attempts")
    .select("*")
    .eq("exam_id", examId)
    .eq("user_id", userId)
    .order("attempt_number", { ascending: false });

  return (data ?? []) as ExamAttempt[];
}

// ── ALUNO ──────────────────────────────────────────────────────

export async function fetchExamByCourse(
  courseId: string,
): Promise<ExamWithAttempt | null> {
  const userId = await getCurrentUserId();

  const { data: exam } = await supabase
    .from("exams")
    .select("*")
    .eq("course_id", courseId)
    .eq("is_published", true)
    .maybeSingle();

  if (!exam) return null;

  if (!userId) {
    return {
      ...(exam as Exam),
      attempt: null,
      attemptHistory: [],
      attemptsUsed: 0,
      attemptsRemaining: (exam as Exam).max_attempts,
      canStartNew: true,
    };
  }

  const attempts = await fetchUserAttempts(exam.id, userId);
  return buildExamWithAttempts(exam as Exam, attempts);
}

export async function fetchStudentExams(): Promise<StudentExamItem[]> {
  const userId = await getCurrentUserId();
  const courses = await fetchPublishedCourses();

  const accessibleCourses = courses.filter(
    (course) => course.isEnrolled || !course.requires_enrollment,
  );

  if (accessibleCourses.length === 0) return [];

  const courseById = new Map(accessibleCourses.map((course) => [course.id, course]));
  const courseIds = accessibleCourses.map((course) => course.id);

  const { data: exams, error } = await supabase
    .from("exams")
    .select("*")
    .eq("is_published", true)
    .in("course_id", courseIds)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!exams?.length) return [];

  if (userId) {
    const examIds = exams.map((exam) => exam.id);
    const { data } = await supabase
      .from("exam_attempts")
      .select("*")
      .eq("user_id", userId)
      .in("exam_id", examIds)
      .order("attempt_number", { ascending: false });

    const allAttempts = (data ?? []) as ExamAttempt[];
    const attemptsByExam = new Map<string, ExamAttempt[]>();

    for (const attempt of allAttempts) {
      const list = attemptsByExam.get(attempt.exam_id) ?? [];
      list.push(attempt);
      attemptsByExam.set(attempt.exam_id, list);
    }

    return (exams as Exam[]).map((exam) => {
      const course = courseById.get(exam.course_id);
      const attempts = attemptsByExam.get(exam.id) ?? [];

      return {
        ...buildExamWithAttempts(exam, attempts),
        course: {
          id: course!.id,
          title: course!.title,
          slug: course!.slug,
          thumbnail_url: course!.thumbnail_url,
        },
      };
    });
  }

  return (exams as Exam[]).map((exam) => {
    const course = courseById.get(exam.course_id);

    return {
      ...buildExamWithAttempts(exam, []),
      course: {
        id: course!.id,
        title: course!.title,
        slug: course!.slug,
        thumbnail_url: course!.thumbnail_url,
      },
    };
  });
}

export async function fetchExamQuestions(examId: string): Promise<ExamQuestion[]> {
  const { data, error } = await supabase
    .from("exam_questions")
    .select(
      `
      id, exam_id, type, order_index, statement, points,
      options:exam_question_options(id, question_id, label, text, order_index)
    `,
    )
    .eq("exam_id", examId)
    .order("order_index");

  if (error) throw error;

  return (data ?? []).map((question) => ({
    ...(question as ExamQuestion),
    options: (question.options ?? []).sort(
      (a: { order_index: number }, b: { order_index: number }) =>
        a.order_index - b.order_index,
    ),
  }));
}

export async function startOrResumeAttempt(examId: string): Promise<ExamAttempt> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Usuário não autenticado");

  const { data: exam } = await supabase
    .from("exams")
    .select("max_attempts")
    .eq("id", examId)
    .single();

  if (!exam) throw new Error("Prova não encontrada");

  const attempts = await fetchUserAttempts(examId, userId);
  const inProgress = attempts.find((a) => a.status === "in_progress");

  if (inProgress) return inProgress;

  const finishedCount = attempts.filter((a) => a.status !== "in_progress").length;

  if (finishedCount >= (exam.max_attempts as number)) {
    throw new Error("Você esgotou todas as tentativas disponíveis para esta prova");
  }

  const { data, error } = await supabase
    .from("exam_attempts")
    .insert({
      exam_id: examId,
      user_id: userId,
      attempt_number: finishedCount + 1,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ExamAttempt;
}

export async function saveAnswer(
  attemptId: string,
  questionId: string,
  payload: { selected_option_id?: string; essay_answer?: string },
): Promise<void> {
  const { error } = await supabase.from("exam_answers").upsert(
    {
      attempt_id: attemptId,
      question_id: questionId,
      selected_option_id: payload.selected_option_id ?? null,
      essay_answer: payload.essay_answer ?? null,
    },
    { onConflict: "attempt_id,question_id" },
  );

  if (error) throw error;
}

export async function fetchAttemptAnswers(attemptId: string): Promise<ExamAnswer[]> {
  const { data, error } = await supabase
    .from("exam_answers")
    .select("*")
    .eq("attempt_id", attemptId);

  if (error) throw error;
  return (data ?? []) as ExamAnswer[];
}

export async function submitExam(attemptId: string): Promise<ExamAttempt> {
  const { error: rpcError } = await supabase.rpc("calculate_exam_score", {
    p_attempt_id: attemptId,
  });

  if (rpcError) throw rpcError;

  const { data, error } = await supabase
    .from("exam_attempts")
    .select("*")
    .eq("id", attemptId)
    .single();

  if (error) throw error;
  return data as ExamAttempt;
}

export async function fetchAttemptResult(
  attemptId: string,
): Promise<AttemptWithDetails | null> {
  const { data, error } = await supabase
    .from("exam_attempts")
    .select(
      `
      *,
      exam:exams(*),
      answers:exam_answers(
        *,
        question:exam_questions(
          *,
          options:exam_question_options(*)
        )
      ),
      profile:profiles!exam_attempts_user_id_fkey(name, avatar_url)
    `,
    )
    .eq("id", attemptId)
    .maybeSingle();

  if (error) throw error;
  return (data as AttemptWithDetails) ?? null;
}

// ── ADMIN ──────────────────────────────────────────────────────

export async function fetchAllExamsAdmin(): Promise<ExamAdminListItem[]> {
  const { data, error } = await supabase
    .from("exams")
    .select(
      `
      *,
      course:courses(id, title),
      exam_questions(id),
      exam_attempts(id, status)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const questions = (row.exam_questions ?? []) as { id: string }[];
    const attempts = (row.exam_attempts ?? []) as { id: string; status: string }[];

    return {
      ...(row as Exam),
      course: row.course as { id: string; title: string } | null,
      question_count: questions.length,
      submitted_count: attempts.filter((a) => a.status === "submitted").length,
    };
  });
}

export async function fetchExamAttempts(examId: string): Promise<AttemptWithDetails[]> {
  const { data, error } = await supabase
    .from("exam_attempts")
    .select(
      `
      *,
      exam:exams(*),
      answers:exam_answers(
        *,
        question:exam_questions(*, options:exam_question_options(*))
      ),
      profile:profiles!exam_attempts_user_id_fkey(name, avatar_url)
    `,
    )
    .eq("exam_id", examId)
    .order("submitted_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as AttemptWithDetails[];
}

type EssayCorrection = {
  answerId: string;
  score_earned: number;
  admin_feedback?: string;
};

export async function gradeAttempt(
  attemptId: string,
  corrections: EssayCorrection[],
  adminFeedback: string,
): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Usuário não autenticado");

  for (const correction of corrections) {
    const { error } = await supabase
      .from("exam_answers")
      .update({
        score_earned: correction.score_earned,
        admin_feedback: correction.admin_feedback ?? null,
      })
      .eq("id", correction.answerId);

    if (error) throw error;
  }

  const { data: answers, error: answersError } = await supabase
    .from("exam_answers")
    .select("score_earned, question:exam_questions(points)")
    .eq("attempt_id", attemptId);

  if (answersError) throw answersError;

  type AnswerRow = {
    score_earned: number;
    question: { points: number } | { points: number }[];
  };

  const rows = (answers ?? []) as AnswerRow[];
  const totalPoints = rows.reduce((sum, answer) => {
    const question = Array.isArray(answer.question)
      ? answer.question[0]
      : answer.question;
    return sum + (question?.points ?? 0);
  }, 0);
  const earnedPoints = rows.reduce((sum, answer) => sum + answer.score_earned, 0);
  const finalScore = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

  const { data: attempt, error: attemptError } = await supabase
    .from("exam_attempts")
    .select("exam:exams(passing_score)")
    .eq("id", attemptId)
    .single();

  if (attemptError) throw attemptError;

  const examData = attempt.exam as { passing_score: number } | { passing_score: number }[];
  const passingScore = Array.isArray(examData)
    ? examData[0]?.passing_score
    : examData?.passing_score;

  const { error: updateError } = await supabase
    .from("exam_attempts")
    .update({
      status: "graded",
      graded_at: new Date().toISOString(),
      graded_by: userId,
      final_score: finalScore,
      passed: finalScore >= (passingScore ?? 60),
      admin_feedback: adminFeedback,
    })
    .eq("id", attemptId);

  if (updateError) throw updateError;

  const { data: attemptRow } = await supabase
    .from("exam_attempts")
    .select("user_id, passed, exam:exams(title, course:courses(slug))")
    .eq("id", attemptId)
    .single();

  if (attemptRow) {
    const examRaw = attemptRow.exam;
    const examInfo = (Array.isArray(examRaw) ? examRaw[0] : examRaw) as {
      title: string;
      course: { slug: string } | { slug: string }[];
    };
    const courseRaw = examInfo.course;
    const slug = Array.isArray(courseRaw) ? courseRaw[0]?.slug : courseRaw?.slug;

    await sendNotification(attemptRow.user_id as string, {
      type: "exam_graded",
      title: "Prova corrigida",
      message: `Sua prova "${examInfo.title}" foi corrigida. Confira o resultado.`,
      link: slug ? `/curso/${slug}/prova/resultado` : undefined,
    });

    if (attemptRow.passed) {
      await checkExamAchievements(attemptRow.user_id as string);
    }
  }
}

export async function createExam(exam: Partial<Exam>): Promise<Exam> {
  const { data, error } = await supabase.from("exams").insert(exam).select().single();
  if (error) throw error;
  return data as Exam;
}

export async function updateExam(id: string, exam: Partial<Exam>): Promise<void> {
  const { error } = await supabase
    .from("exams")
    .update({ ...exam, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteExam(id: string): Promise<void> {
  const { error } = await supabase.from("exams").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchExamWithQuestions(examId: string) {
  const { data, error } = await supabase
    .from("exams")
    .select(`*, questions:exam_questions(*, options:exam_question_options(*))`)
    .eq("id", examId)
    .single();

  if (error) throw error;

  const questions = (data.questions ?? []).sort(
    (a: { order_index: number }, b: { order_index: number }) =>
      a.order_index - b.order_index,
  );

  return {
    ...data,
    questions: questions.map((q: ExamQuestion & { options?: ExamQuestionOption[] }) => ({
      ...q,
      options: (q.options ?? []).sort(
        (a: { order_index: number }, b: { order_index: number }) =>
          a.order_index - b.order_index,
      ),
    })),
  };
}

type ExamQuestionOptionInput = {
  label: string;
  text: string;
  is_correct: boolean;
};

type SaveQuestionInput = Partial<ExamQuestion> & { exam_id: string };

export async function saveQuestion(question: SaveQuestionInput) {
  const { id, options: _options, ...rest } = question;

  if (id) {
    const { data, error } = await supabase
      .from("exam_questions")
      .update(rest)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as ExamQuestion;
  }

  const { data, error } = await supabase
    .from("exam_questions")
    .insert(rest)
    .select()
    .single();

  if (error) throw error;
  return data as ExamQuestion;
}

export async function saveQuestionOptions(
  questionId: string,
  options: ExamQuestionOptionInput[],
) {
  const { error: deleteError } = await supabase
    .from("exam_question_options")
    .delete()
    .eq("question_id", questionId);

  if (deleteError) throw deleteError;

  if (options.length === 0) return;

  const { error } = await supabase.from("exam_question_options").insert(
    options.map((option, index) => ({
      ...option,
      question_id: questionId,
      order_index: index,
    })),
  );

  if (error) throw error;
}

export async function deleteQuestion(questionId: string): Promise<void> {
  const { error } = await supabase.from("exam_questions").delete().eq("id", questionId);
  if (error) throw error;
}

export async function reorderQuestion(
  questionId: string,
  orderIndex: number,
): Promise<void> {
  const { error } = await supabase
    .from("exam_questions")
    .update({ order_index: orderIndex })
    .eq("id", questionId);

  if (error) throw error;
}