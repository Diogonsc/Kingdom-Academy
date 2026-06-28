import type { LoaderFunctionArgs } from "react-router-dom";
import {
  fetchCourseBySlug,
  fetchCourseLessons,
  fetchCourseModules,
} from "@/services/courses";
import type { CourseLoaderData } from "@/types/database";

export async function courseLoader({ params }: LoaderFunctionArgs) {
  const course = await fetchCourseBySlug(params.id ?? "");

  if (!course) {
    throw new Response("Curso não encontrado", { status: 404 });
  }

  const [lessons, modules] = await Promise.all([
    fetchCourseLessons(course.id),
    fetchCourseModules(course.id),
  ]);

  return { course, lessons, modules } satisfies CourseLoaderData;
}
