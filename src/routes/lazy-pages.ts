import { lazy } from "react";

export const DashboardPage = lazy(() =>
  import("@/pages/dashboard").then((module) => ({
    default: module.DashboardPage,
  })),
);

export const MyCoursesPage = lazy(() =>
  import("@/pages/my-courses-page").then((module) => ({
    default: module.MyCoursesPage,
  })),
);

export const MyExamsPage = lazy(() =>
  import("@/pages/my-exams-page").then((module) => ({
    default: module.MyExamsPage,
  })),
);

export const BookstorePage = lazy(() =>
  import("@/pages/bookstore-page").then((module) => ({
    default: module.BookstorePage,
  })),
);

export const MyCertificatesPage = lazy(() =>
  import("@/pages/my-certificates-page").then((module) => ({
    default: module.MyCertificatesPage,
  })),
);

export const CoursePage = lazy(() =>
  import("@/pages/course").then((module) => ({
    default: module.CoursePage,
  })),
);

export const ForgotPasswordPage = lazy(() =>
  import("@/pages/forgot-password-page").then((module) => ({
    default: module.ForgotPasswordPage,
  })),
);

export const DashboardAdminPage = lazy(() =>
  import("@/pages/admin-dashboard-page").then((module) => ({
    default: module.DashboardAdminPage,
  })),
);

export const CourseAdminPage = lazy(() =>
  import("@/pages/admin-course-page").then((module) => ({
    default: module.CourseAdminPage,
  })),
);

export const NewCoursePage = lazy(() =>
  import("@/pages/admin-new-course-page").then((module) => ({
    default: module.NewCoursePage,
  })),
);

export const AdminStudentsPage = lazy(() =>
  import("@/pages/admin-students-page").then((module) => ({
    default: module.AdminStudentsPage,
  })),
);

export const AdminEnrollmentsPage = lazy(() =>
  import("@/pages/admin-enrollments-page").then((module) => ({
    default: module.AdminEnrollmentsPage,
  })),
);

export const AdminStudentDetailPage = lazy(() =>
  import("@/pages/admin-student-detail-page").then((module) => ({
    default: module.AdminStudentDetailPage,
  })),
);

export const AdminBannersPage = lazy(() =>
  import("@/pages/admin-banners-page").then((module) => ({
    default: module.AdminBannersPage,
  })),
);

export const ProfilePage = lazy(() =>
  import("@/pages/profile-page").then((module) => ({
    default: module.ProfilePage,
  })),
);

export const ExamPage = lazy(() =>
  import("@/pages/exam").then((module) => ({
    default: module.ExamPage,
  })),
);

export const ExamResultPage = lazy(() =>
  import("@/pages/exam/result").then((module) => ({
    default: module.ExamResultPage,
  })),
);

export const ExamAdminPage = lazy(() =>
  import("@/pages/admin-exams-page").then((module) => ({
    default: module.ExamAdminPage,
  })),
);

export const ExamFormPage = lazy(() =>
  import("@/pages/admin-exam-form-page").then((module) => ({
    default: module.ExamFormPage,
  })),
);

export const ExamCorrectionsPage = lazy(() =>
  import("@/pages/admin-exam-corrections-page").then((module) => ({
    default: module.ExamCorrectionsPage,
  })),
);
