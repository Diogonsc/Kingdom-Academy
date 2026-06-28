import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BadgeCheck, XCircle } from "lucide-react";
import logo from "@/assets/logo.png";
import { Loading } from "@/components/loading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";
import {
  verifyCertificate,
  type VerifiedCertificate,
} from "@/services/certificates";

export function VerifyCertificatePage() {
  const { certificateId } = useParams();
  const [result, setResult] = useState<VerifiedCertificate | null | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!certificateId) {
      setResult(null);
      return;
    }

    async function load(id: string) {
      try {
        const data = await verifyCertificate(id);
        setResult(data);
      } catch {
        setResult(null);
      }
    }

    void load(certificateId);
  }, [certificateId]);

  if (result === undefined) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loading message="Verificando certificado..." />
      </div>
    );
  }

  const isValid = result !== null;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-3 text-center">
          <img src={logo} alt={APP_NAME} className="mx-auto h-16 object-contain" />
          <CardTitle className="font-display text-2xl">
            Verificação de Certificado
          </CardTitle>
          <CardDescription>
            {isValid
              ? "Este certificado é autêntico e foi emitido pela Kingdom Academy."
              : "Não encontramos um certificado válido com este identificador."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isValid ? (
            <>
              <div className="flex justify-center">
                <BadgeCheck className="size-12 text-emerald-600" />
              </div>
              <dl className="space-y-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Aluno</dt>
                  <dd className="font-semibold">{result.student_name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Curso</dt>
                  <dd className="font-semibold">{result.course_title}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Emitido em</dt>
                  <dd className="font-semibold">
                    {new Date(result.issued_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">ID</dt>
                  <dd className="font-mono text-xs">{result.certificate_id}</dd>
                </div>
              </dl>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <XCircle className="size-12 text-destructive" />
              <p className="text-sm text-muted-foreground">
                Verifique se o link ou QR Code está correto e tente novamente.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
