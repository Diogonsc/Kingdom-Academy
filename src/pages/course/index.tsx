import { useEffect, useState } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CertificateModal } from "@/components/certificate-modal";
import { ScoreBadge } from "@/components/exam/score-badge";
import { ProgressBar } from "@/components/progress-bar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { calculateCourseDurationHours } from "@/lib/course-duration";
import { issueCertificate, markLessonComplete } from "@/services/courses";
import { fetchExamByCourse } from "@/services/exams";
import type { CourseLoaderData, Lesson } from "@/types/database";
import type { ExamWithAttempt } from "@/types/exam";
import { LessonList } from "./lesson-list";
import { VideoPlayer } from "./video-player";

export function CoursePage() {
  const { course, lessons: initialLessons, modules } =
    useLoaderData() as CourseLoaderData;
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
  const [activeLessonId, setActiveLessonId] = useState(
    initialLessons[0]?.id ?? "",
  );
  const [certificateOpen, setCertificateOpen] = useState(false);
  const [certificateDate, setCertificateDate] = useState(new Date().toISOString());
  const [certificateId, setCertificateId] = useState("");
  const [exam, setExam] = useState<ExamWithAttempt | null>(null);
  const [autoplayLessonId, setAutoplayLessonId] = useState<string | null>(null);

  useEffect(() => {
    const isAdmin = profile?.role === "admin";

    if (course.requires_enrollment && !course.isEnrolled && !isAdmin) {
      if (course.enrollmentStatus === "pending") {
        toast.error("Sua matrícula aguarda aprovação do administrador.");
      } else if (course.enrollmentStatus === "rejected") {
        toast.error("Sua solicitação de matrícula foi rejeitada.");
      } else {
        toast.error("Você precisa solicitar acesso para assistir este curso.");
      }
      navigate("/meus-cursos");
    }
  }, [course, navigate, profile?.role]);

  useEffect(() => {
    async function loadExam() {
      const examData = await fetchExamByCourse(course.id);
      setExam(examData);
    }

    void loadExam();
  }, [course.id]);

  const activeLessonIndex = lessons.findIndex(
    (lesson) => lesson.id === activeLessonId,
  );
  const activeLesson = lessons[activeLessonIndex] ?? lessons[0];

  function getExamButtonLabel() {
    if (!exam?.attempt) return "Fazer Prova";
    if (exam.attempt.status === "in_progress") return "Continuar Prova";
    if (exam.attempt.status === "submitted") return "Ver Status";
    return "Ver Resultado";
  }

  function handleExamClick() {
    const slug = course.slug;
    if (!exam?.attempt || exam.attempt.status === "in_progress") {
      navigate(`/curso/${slug}/prova`);
      return;
    }

    navigate(`/curso/${slug}/prova/resultado`);
  }

  async function handleMarkComplete(
    lessonId: string,
    options?: { advanceToNext?: boolean },
  ) {
    const currentIndex = lessons.findIndex((lesson) => lesson.id === lessonId);

    try {
      const lesson = lessons[currentIndex];
      if (!lesson || lesson.isCompleted) {
        if (options?.advanceToNext && currentIndex < lessons.length - 1) {
          setAutoplayLessonId(lessons[currentIndex + 1].id);
          setActiveLessonId(lessons[currentIndex + 1].id);
        }
        return;
      }

      await markLessonComplete(lessonId);

      const updatedLessons = lessons.map((item) =>
        item.id === lessonId ? { ...item, isCompleted: true } : item,
      );

      setLessons(updatedLessons);

      const allCompleted =
        updatedLessons.length > 0 &&
        updatedLessons.every((item) => item.isCompleted);

      if (allCompleted) {
        const certificate = await issueCertificate(course.id);
        setCertificateDate(certificate.issued_at);
        setCertificateId(certificate.id);
        setCertificateOpen(true);
        toast.success("Parabéns! Você concluiu o curso e recebeu seu certificado.");
      } else if (options?.advanceToNext && currentIndex < lessons.length - 1) {
        setAutoplayLessonId(lessons[currentIndex + 1].id);
        setActiveLessonId(lessons[currentIndex + 1].id);
        toast.success("Aula concluída! Avançando para a próxima.");
      } else {
        toast.success("Aula marcada como concluída!");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao marcar aula como concluída",
      );
    }
  }

  function handleVideoEnded() {
    void handleMarkComplete(activeLesson.id, { advanceToNext: true });
  }

  async function selectLessonByIndex(index: number) {
    setAutoplayLessonId(null);

    const currentLesson = lessons[activeLessonIndex];
    const nextLesson = lessons[index];

    if (!nextLesson) return;

    if (
      index > activeLessonIndex &&
      currentLesson &&
      !currentLesson.isCompleted
    ) {
      await handleMarkComplete(currentLesson.id);
    }

    setActiveLessonId(nextLesson.id);
  }

  function handleSelectLesson(lessonId: string) {
    setAutoplayLessonId(null);
    setActiveLessonId(lessonId);
  }

  if (!activeLesson) {
    return (
      <div className="p-4 text-muted-foreground">
        Este curso ainda não possui aulas cadastradas.
      </div>
    );
  }

  const completedCount = lessons.filter((lesson) => lesson.isCompleted).length;
  const progressPercent =
    lessons.length > 0
      ? Math.round((completedCount / lessons.length) * 100)
      : 0;

  return (
    <>
      <div className="border-b border-border bg-card px-4 py-4">
        <div className="mx-auto flex max-w-3xl flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              Progresso: {completedCount} de {lessons.length} aulas concluídas
            </span>
            <span className="text-muted-foreground">{progressPercent}%</span>
          </div>
          <ProgressBar value={progressPercent} />
        </div>
      </div>

      <div className="flex flex-col lg:min-h-[calc(100svh-3rem)] lg:flex-row lg:items-stretch">
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-4">
          <VideoPlayer
            lesson={activeLesson}
            lessonIndex={activeLessonIndex}
            totalLessons={lessons.length}
            hasPrevious={activeLessonIndex > 0}
            hasNext={activeLessonIndex < lessons.length - 1}
            onPrevious={() => void selectLessonByIndex(activeLessonIndex - 1)}
            onNext={() => void selectLessonByIndex(activeLessonIndex + 1)}
            onMarkComplete={() => void handleMarkComplete(activeLesson.id)}
            onVideoEnded={handleVideoEnded}
            autoplay={activeLesson.id === autoplayLessonId}
          />

          {exam ? (
            <section className="rounded-xl border border-border p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">📝 {exam.title}</h3>
                  {exam.description ? (
                    <p className="text-sm text-muted-foreground">
                      {exam.description}
                    </p>
                  ) : null}
                  {exam.attempt?.status === "graded" ? (
                    <ScoreBadge
                      score={exam.attempt.final_score}
                      passed={exam.attempt.passed}
                      passingScore={exam.passing_score}
                    />
                  ) : null}
                </div>
                <Button className="px-4 py-2" onClick={handleExamClick}>{getExamButtonLabel()}</Button>
              </div>
            </section>
          ) : null}
        </div>
        <LessonList
          lessons={lessons}
          modules={modules}
          activeLessonId={activeLessonId}
          onSelectLesson={handleSelectLesson}
        />
      </div>

      <CertificateModal
        open={certificateOpen}
        onOpenChange={setCertificateOpen}
        studentName={profile?.name ?? "Aluno"}
        courseName={course.title}
        issuedAt={certificateDate}
        durationHours={calculateCourseDurationHours(lessons)}
        certificateId={certificateId}
      />
    </>
  );
}
