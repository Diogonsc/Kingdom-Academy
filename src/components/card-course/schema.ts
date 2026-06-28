import { z } from "zod";
import type { CourseWithProgress } from "@/types/database";

export const cardCourseSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  thumbnail_url: z.string().optional(),
  isPublished: z.boolean(),
  isCompleted: z.boolean(),
  requiresEnrollment: z.boolean(),
  isEnrolled: z.boolean().optional(),
  enrollmentStatus: z.enum(["pending", "approved", "rejected"]).nullable().optional(),
  progressPercent: z.number().optional(),
});

export type CardCourseSchema = z.infer<typeof cardCourseSchema>;

export function toCardCourse(course: CourseWithProgress): CardCourseSchema {
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    thumbnail_url: course.thumbnail_url ?? undefined,
    isPublished: course.is_published,
    isCompleted: course.isCompleted,
    requiresEnrollment: course.requires_enrollment,
    isEnrolled: course.isEnrolled,
    enrollmentStatus: course.enrollmentStatus,
    progressPercent: course.progressPercent,
  };
}
