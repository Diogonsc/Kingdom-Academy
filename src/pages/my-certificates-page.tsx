import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import { CertificateCard } from "@/components/certificate-card";
import { CertificateModal } from "@/components/certificate-modal";
import { CardCourseSkeletonGrid } from "@/components/card-skeletons";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { fetchCourseDurationHours, fetchMyCertificates } from "@/services/courses";
import type { CertificateWithCourse } from "@/types/database";

export function MyCertificatesPage() {
  const { profile } = useAuth();
  const [certificates, setCertificates] = useState<CertificateWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] =
    useState<CertificateWithCourse | null>(null);
  const [selectedDurationHours, setSelectedDurationHours] = useState(0);

  useEffect(() => {
    async function loadCertificates() {
      try {
        const data = await fetchMyCertificates();
        setCertificates(data);
      } catch (error) {
        console.error("Erro ao carregar certificados:", error);
      } finally {
        setLoading(false);
      }
    }

    void loadCertificates();
  }, []);

  async function handleViewCertificate(certificate: CertificateWithCourse) {
    setSelectedCertificate(certificate);

    try {
      const durationHours = await fetchCourseDurationHours(certificate.course_id);
      setSelectedDurationHours(durationHours);
    } catch (error) {
      console.error("Erro ao carregar carga horária:", error);
      setSelectedDurationHours(0);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-4">
        <CardCourseSkeletonGrid count={4} />
      </div>
    );
  }

  const studentName = profile?.name ?? "Aluno";

  if (certificates.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          icon={<GraduationCap className="size-6" />}
          title="Nenhum certificado ainda"
          description="Conclua um curso e seja aprovado na prova para receber seu certificado de conclusão."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <section className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold">Meus Certificados</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Seus certificados de conclusão de cursos.
          </p>
        </div>

        <div className="flex flex-wrap gap-6">
          {certificates.map((certificate) => (
            <CertificateCard
              key={certificate.id}
              certificate={certificate}
              studentName={studentName}
              className="mx-0 shrink-0"
              onView={() => void handleViewCertificate(certificate)}
            />
          ))}
        </div>
      </section>

      {selectedCertificate ? (
        <CertificateModal
          open={Boolean(selectedCertificate)}
          onOpenChange={(open) => {
            if (!open) setSelectedCertificate(null);
          }}
          studentName={studentName}
          courseName={selectedCertificate.course.title}
          issuedAt={selectedCertificate.issued_at}
          durationHours={selectedDurationHours}
          certificateId={selectedCertificate.id}
        />
      ) : null}
    </div>
  );
}
