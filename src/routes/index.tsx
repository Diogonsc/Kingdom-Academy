import { Suspense } from "react";
import { createBrowserRouter, Outlet } from "react-router-dom";
import { Loading } from "@/components/loading";
import { Toaster } from "@/components/ui/sonner";
import { AppLayout } from "@/layouts/app-layout";
import { courseLoader } from "@/loaders/course-loader";
import { HomePage } from "@/pages/home-page";
import { LoginPage } from "@/pages/login-page";
import { RegisterPage } from "@/pages/register-page";
import { ResetPasswordPage } from "@/pages/reset-password-page";
import { VerifyCertificatePage } from "@/pages/verify-certificate-page";
import type { CourseLoaderData } from "@/types/database";
import type { RouteHandle } from "@/types/router";
import { AdminRoute, ProtectedRoute } from "./guards";
import {
  AdminStudentsPage,
  AdminStudentDetailPage,
  AdminEnrollmentsPage,
  AdminBannersPage,
  BookstorePage,
  CourseAdminPage,
  CoursePage,
  DashboardAdminPage,
  DashboardPage,
  ExamAdminPage,
  ExamCorrectionsPage,
  ExamFormPage,
  ExamPage,
  ExamResultPage,
  ForgotPasswordPage,
  MyCertificatesPage,
  MyCoursesPage,
  MyExamsPage,
  NewCoursePage,
  ProfilePage,
} from "./lazy-pages";

export const router = createBrowserRouter([
  {
    element: (
      <>
        <Outlet />
        <Toaster richColors position="top-right" />
      </>
    ),
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/verificar-certificado/:certificateId",
        element: <VerifyCertificatePage />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              {
                path: "/dashboard",
                element: (
                  <Suspense
                    fallback={
                      <Loading message="Carregando página de dashboard..." />
                    }
                  >
                    <DashboardPage />
                  </Suspense>
                ),
                handle: { breadcrumb: "Página Inicial" } satisfies RouteHandle,
              },
              {
                path: "/perfil",
                element: (
                  <Suspense fallback={<Loading message="Carregando perfil..." />}>
                    <ProfilePage />
                  </Suspense>
                ),
                handle: { breadcrumb: "Meu Perfil" } satisfies RouteHandle,
              },
              {
                path: "/meus-cursos",
                element: (
                  <Suspense
                    fallback={
                      <Loading message="Carregando página de meus cursos..." />
                    }
                  >
                    <MyCoursesPage />
                  </Suspense>
                ),
                handle: { breadcrumb: "Meus Cursos" } satisfies RouteHandle,
              },
              {
                path: "/provas",
                element: (
                  <Suspense
                    fallback={
                      <Loading message="Carregando página de provas..." />
                    }
                  >
                    <MyExamsPage />
                  </Suspense>
                ),
                handle: { breadcrumb: "Provas" } satisfies RouteHandle,
              },
              {
                path: "/livraria",
                element: (
                  <Suspense
                    fallback={
                      <Loading message="Carregando página de livraria..." />
                    }
                  >
                    <BookstorePage />
                  </Suspense>
                ),
                handle: { breadcrumb: "Livraria" } satisfies RouteHandle,
              },
              {
                path: "/meus-certificados",
                element: (
                  <Suspense
                    fallback={
                      <Loading message="Carregando página de meus certificados..." />
                    }
                  >
                    <MyCertificatesPage />
                  </Suspense>
                ),
                handle: { breadcrumb: "Meus Certificados" } satisfies RouteHandle,
              },
              {
                path: "/curso/:id",
                element: (
                  <Suspense
                    fallback={<Loading message="Carregando página de curso..." />}
                  >
                    <CoursePage />
                  </Suspense>
                ),
                loader: courseLoader,
                handle: {
                  breadcrumbs: (match) => {
                    const { course } = match.data as CourseLoaderData;

                    return [
                      { label: "Meus Cursos", href: "/meus-cursos" },
                      { label: course.title, href: match.pathname },
                    ];
                  },
                } satisfies RouteHandle,
              },
              {
                path: "/curso/:id/prova",
                element: (
                  <Suspense fallback={<Loading message="Carregando prova..." />}>
                    <ExamPage />
                  </Suspense>
                ),
                handle: { breadcrumb: "Prova" } satisfies RouteHandle,
              },
              {
                path: "/curso/:id/prova/resultado",
                element: (
                  <Suspense
                    fallback={<Loading message="Carregando resultado..." />}
                  >
                    <ExamResultPage />
                  </Suspense>
                ),
                handle: { breadcrumb: "Resultado" } satisfies RouteHandle,
              },
            ],
          },
        ],
      },
      {
        element: <AdminRoute />,
        children: [
          {
            path: "/admin",
            element: <AppLayout />,
            children: [
              {
                path: "dashboard",
                element: (
                  <Suspense
                    fallback={
                      <Loading message="Carregando página de dashboard admin..." />
                    }
                  >
                    <DashboardAdminPage />
                  </Suspense>
                ),
                handle: { breadcrumb: "Dashboard Admin" } satisfies RouteHandle,
              },
              {
                path: "cursos",
                element: (
                  <Suspense
                    fallback={<Loading message="Carregando página de cursos..." />}
                  >
                    <CourseAdminPage />
                  </Suspense>
                ),
                handle: { breadcrumb: "Cursos Admin" } satisfies RouteHandle,
              },
              {
                path: "cursos/:id/editar",
                element: (
                  <Suspense
                    fallback={
                      <Loading message="Carregando página de edição de curso..." />
                    }
                  >
                    <NewCoursePage />
                  </Suspense>
                ),
                handle: { breadcrumb: "Editar Curso" } satisfies RouteHandle,
              },
              {
                path: "matriculas",
                element: (
                  <Suspense
                    fallback={
                      <Loading message="Carregando página de matrículas..." />
                    }
                  >
                    <AdminEnrollmentsPage />
                  </Suspense>
                ),
                handle: { breadcrumb: "Matrículas" } satisfies RouteHandle,
              },
              {
                path: "membros",
                element: (
                  <Suspense
                    fallback={
                      <Loading message="Carregando página de membros..." />
                    }
                  >
                    <AdminStudentsPage />
                  </Suspense>
                ),
                handle: { breadcrumb: "Membros" } satisfies RouteHandle,
              },
              {
                path: "membros/:userId",
                element: (
                  <Suspense
                    fallback={
                      <Loading message="Carregando analytics do aluno..." />
                    }
                  >
                    <AdminStudentDetailPage />
                  </Suspense>
                ),
                handle: { breadcrumb: "Analytics do Aluno" } satisfies RouteHandle,
              },
              {
                path: "banners",
                element: (
                  <Suspense fallback={<Loading message="Carregando banners..." />}>
                    <AdminBannersPage />
                  </Suspense>
                ),
                handle: { breadcrumb: "Banners" } satisfies RouteHandle,
              },
              {
                path: "provas",
                element: (
                  <Suspense fallback={<Loading message="Carregando provas..." />}>
                    <ExamAdminPage />
                  </Suspense>
                ),
                handle: { breadcrumb: "Provas" } satisfies RouteHandle,
              },
              {
                path: "provas/nova",
                element: (
                  <Suspense fallback={<Loading message="Carregando formulário..." />}>
                    <ExamFormPage />
                  </Suspense>
                ),
                handle: { breadcrumb: "Nova Prova" } satisfies RouteHandle,
              },
              {
                path: "provas/:examId/editar",
                element: (
                  <Suspense fallback={<Loading message="Carregando formulário..." />}>
                    <ExamFormPage />
                  </Suspense>
                ),
                handle: { breadcrumb: "Editar Prova" } satisfies RouteHandle,
              },
              {
                path: "provas/:examId/correcoes",
                element: (
                  <Suspense fallback={<Loading message="Carregando correções..." />}>
                    <ExamCorrectionsPage />
                  </Suspense>
                ),
                handle: { breadcrumb: "Correções" } satisfies RouteHandle,
              },
            ],
          },
        ],
      },
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/register",
        element: <RegisterPage />,
      },
      {
        path: "/forgot-password",
        element: (
          <Suspense
            fallback={
              <Loading message="Carregando página de recuperação de senha..." />
            }
          >
            <ForgotPasswordPage />
          </Suspense>
        ),
      },
      {
        path: "/reset-password",
        element: <ResetPasswordPage />,
      },
    ],
  },
]);
