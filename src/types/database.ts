export type UserRole = "member" | "leader" | "admin";

export type Profile = {
  id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
};

export type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail_url: string | null;
  is_published: boolean;
  requires_enrollment: boolean;
  created_at: string;
  updated_at: string;
};

export type Lesson = {
  id: string;
  course_id: string;
  module_id: string | null;
  title: string;
  description: string | null;
  video_id: string | null;
  thumbnail_url: string | null;
  duration: string | null;
  order_index: number;
  created_at: string;
  isCompleted?: boolean;
};

export type CourseModule = {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  created_at: string;
};

export type EnrollmentStatus = "pending" | "approved" | "rejected";

export type Enrollment = {
  id: string;
  user_id: string;
  course_id: string;
  status: EnrollmentStatus;
  enrolled_at: string;
};

export type EnrollmentWithDetails = Enrollment & {
  profile: Pick<Profile, "id" | "name" | "email">;
  course: Pick<Course, "id" | "title" | "slug">;
};

export type LessonProgress = {
  id: string;
  user_id: string;
  lesson_id: string;
  is_completed: boolean;
  completed_at: string | null;
};

export type Certificate = {
  id: string;
  user_id: string;
  course_id: string;
  issued_at: string;
};

export type CertificateWithCourse = Certificate & {
  course: Pick<Course, "id" | "title" | "slug" | "thumbnail_url">;
};

export type Book = {
  id: string;
  title: string;
  description: string | null;
  author: string | null;
  link: string | null;
  image_url: string | null;
  created_at: string;
};

export type BannerLocation = "dashboard" | "bookstore";

export type SiteBanner = {
  id: string;
  location: BannerLocation;
  image_url: string;
  alt_text: string;
  link: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
};

export type LessonNote = {
  id: string;
  user_id: string;
  lesson_id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type CourseWithProgress = Course & {
  isCompleted: boolean;
  progressPercent: number;
  isEnrolled: boolean;
  enrollmentStatus: EnrollmentStatus | null;
  enrolledAt: string | null;
  lessonCount?: number;
  enrollmentCount?: number;
};

export type CourseLoaderData = {
  course: CourseWithProgress;
  lessons: Lesson[];
  modules: CourseModule[];
};
