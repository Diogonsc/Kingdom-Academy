import { Link } from "react-router-dom";
import { PlayIcon } from "lucide-react";
import defaultThumbnail from "@/assets/hero.png";
import { AchievementsSection } from "@/components/achievements-section";
import { Banner } from "@/components/banner";
import { toCardCourse } from "@/components/card-course/schema";
import { CardCourseSkeletonGrid } from "@/components/card-skeletons";
import { CourseCarousel } from "@/components/course-carousel";
import { EnrolledCourses } from "@/components/enrolled-courses";
import { ProgressBar } from "@/components/progress-bar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useCourses } from "@/hooks/use-courses";
import type { CourseWithProgress } from "@/types/database";

function getContinueCourse(
  courses: CourseWithProgress[],
): CourseWithProgress | null {
  const inProgress = courses
    .filter((course) => !course.isCompleted && course.isEnrolled)
    .sort((a, b) => b.progressPercent - a.progressPercent);

  return inProgress[0] ?? null;
}

export function DashboardPage() {
  const { profile } = useAuth();
  const { data: courses, loading, refetch } = useCourses();

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4">
        <CardCourseSkeletonGrid count={4} />
      </div>
    );
  }

  const continueCourse = getContinueCourse(courses);
  const available = courses.filter(
    (course) =>
      !course.isCompleted &&
      !course.isEnrolled &&
      course.enrollmentStatus !== "pending" &&
      course.progressPercent === 0,
  );
  const enrolled = courses.filter(
    (course) =>
      course.isEnrolled ||
      course.progressPercent > 0 ||
      course.isCompleted,
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <Banner location="dashboard" />
      <div>
        <h1 className="text-2xl font-bold">
          Olá, {profile?.name?.split(" ")[0] ?? "Aluno"}!
        </h1>
        <p className="text-muted-foreground">
          Continue sua jornada de aprendizado na Kingdom Academy.
        </p>
      </div>

      {continueCourse ? (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Continuar aprendendo</h2>
          <Card className="p-0 overflow-hidden transition-shadow hover:shadow-md">
            <div className="flex flex-col sm:flex-row">
              <div className="relative h-48 shrink-0 sm:h-auto sm:w-64">
                <img
                  src={continueCourse.thumbnail_url ?? defaultThumbnail}
                  alt={continueCourse.title}
                  className="size-full object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col justify-center gap-4 p-6">
                <div>
                  <CardTitle className="text-lg">{continueCourse.title}</CardTitle>
                  <CardDescription className="mt-1 line-clamp-2">
                    {continueCourse.description}
                  </CardDescription>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Progresso do curso</span>
                    <span className="font-medium text-foreground">
                      {continueCourse.progressPercent}%
                    </span>
                  </div>
                  <ProgressBar value={continueCourse.progressPercent} />
                </div>
                <Button asChild className="w-fit gap-2">
                  <Link to={`/curso/${continueCourse.slug}`}>
                    <PlayIcon className="size-4" />
                    Continuar
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </section>
      ) : available.length > 0 ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Explore novos cursos</h2>
            <p className="text-sm text-muted-foreground">
              Comece uma nova jornada de aprendizado.
            </p>
          </div>
          <CourseCarousel
            courses={available.slice(0, 6).map(toCardCourse)}
            showEnrollmentLock
            onEnrolled={refetch}
          />
        </section>
      ) : null}

      <EnrolledCourses courses={enrolled} />
      <AchievementsSection />
    </div>
  );
}
