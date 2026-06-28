import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  GraduationCap,
  Heart,
  Sparkles,
  Users,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { CardCourse } from "@/components/card-course";
import { toCardCourse } from "@/components/card-course/schema";
import { CardCourseSkeletonGrid } from "@/components/card-skeletons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";
import { fetchPublishedCourses } from "@/services/courses";
import type { CourseWithProgress } from "@/types/database";

const pillars = [
  {
    icon: BookOpen,
    title: "Formação Bíblica",
    description:
      "Cursos fundamentados na Palavra de Deus para fortalecer sua fé e conhecimento.",
  },
  {
    icon: Users,
    title: "Serviço no Reino",
    description:
      "Capacitação prática para servir com excelência em cada área do ministério.",
  },
  {
    icon: Heart,
    title: "Comunhão e Crescimento",
    description:
      "Uma jornada de aprendizado em comunidade, crescendo juntos na graça.",
  },
];

export function HomePage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCourses() {
      const data = await fetchPublishedCourses();
      setCourses(data.slice(0, 3));
      setLoading(false);
    }

    void loadCourses();
  }, []);

  const dashboardUrl = user ? "/dashboard" : "/login";

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt={APP_NAME} className="size-10 object-contain" />
            <span className="font-display text-lg font-semibold">{APP_NAME}</span>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild>
                <Link to="/dashboard">Acessar plataforma</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Entrar</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Criar conta</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 to-background px-4 py-20 text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
              <Sparkles className="size-4" />
              {APP_DESCRIPTION}
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Capacitação para servir no Reino
            </h1>
            <p className="text-lg text-muted-foreground">
              Uma plataforma de formação espiritual para membros, líderes e
              servos que desejam crescer e servir com excelência.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild>
                <Link to={dashboardUrl}>
                  <GraduationCap className="size-4" />
                  {user ? "Ir para meus cursos" : "Começar agora"}
                </Link>
              </Button>
              {!user ? (
                <Button size="lg" variant="outline" asChild>
                  <Link to="/register">Criar conta gratuita</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-10 text-center">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              Nossos pilares
            </h2>
            <p className="mt-2 text-muted-foreground">
              Uma formação completa para quem deseja servir com propósito.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {pillars.map((pillar) => (
              <Card
                key={pillar.title}
                className="transition-shadow hover:shadow-md"
              >
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <pillar.icon className="size-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{pillar.title}</CardTitle>
                  <CardDescription>{pillar.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-t border-border bg-muted/30 px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center">
              <h2 className="font-display text-2xl font-bold sm:text-3xl">
                Cursos disponíveis
              </h2>
              <p className="mt-2 text-muted-foreground">
                Conheça alguns dos cursos que preparamos para você.
              </p>
            </div>
            {loading ? (
              <CardCourseSkeletonGrid count={3} />
            ) : courses.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-6">
                {courses.map((course) => (
                  <CardCourse
                    key={course.id}
                    course={toCardCourse(course)}
                    className="mx-0 shrink-0"
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  Novos cursos em breve. Cadastre-se para ser avisado!
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <section className="px-4 py-16 text-center">
          <div className="mx-auto max-w-xl space-y-4">
            <h2 className="font-display text-2xl font-bold">
              Pronto para começar sua jornada?
            </h2>
            <p className="text-muted-foreground">
              Junte-se à comunidade e desenvolva seus dons para servir no Reino
              de Deus.
            </p>
            <Button size="lg" asChild>
              <Link to={user ? "/dashboard" : "/register"}>
                {user ? "Acessar plataforma" : "Criar minha conta"}
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {APP_NAME}. Capacitação para servir no Reino.
      </footer>
    </div>
  );
}
