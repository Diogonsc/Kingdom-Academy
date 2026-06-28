import { Card } from "@/components/ui/card";
import { Award, BadgeCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import logo from "@/assets/logo.png";

interface CertificateProps {
  studentName: string;
  courseName: string;
  completionDate: string;
  durationHours: number;
  certificateId: string;
}

function getVerificationUrl(certificateId: string) {
  return `${window.location.origin}/verificar-certificado/${certificateId}`;
}

export default function Certificate({
  studentName,
  courseName,
  completionDate,
  durationHours,
  certificateId,
}: CertificateProps) {
  const workloadText =
    durationHours > 0
      ? `com carga horária total de ${durationHours} horas`
      : "conforme registrado na plataforma";

  return (
    <div className="w-full max-w-4xl mx-auto p-4 select-none print:p-0">
      <Card id="certificate-export" className="relative overflow-hidden rounded-none border-[12px] border-slate-900 bg-slate-50 p-2 shadow-2xl">
        <div className="border-2 border-[#D4AF37] h-full w-full p-8 md:p-12 flex flex-col justify-between items-center text-center relative bg-white">
          <div className="absolute inset-0 opacity-[0.10] pointer-events-none flex items-center justify-center">
            <img src={logo} alt="Kingdom Academy" className="w-[450px] h-[450px]" />
          </div>

          <div className="space-y-2 z-10">
            <div className="flex justify-center items-center gap-2 text-[#D4AF37] font-semibold tracking-widest text-xs uppercase">
              <Award className="w-5 h-5" />
              Kingdom Academy
              <Award className="w-5 h-5" />
            </div>
            <h1 className="text-3xl md:text-5xl font-serif tracking-wide text-slate-900 pt-2">
              Certificado de Conclusão
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground tracking-widest uppercase pt-1">
              Capacitação para servir no Reino
            </p>
          </div>

          <div className="my-8 space-y-4 z-10 max-w-2xl">
            <p className="text-sm md:text-base text-slate-500 italic">
              Certificamos que para todos os efeitos de direito e fins específicos,
            </p>

            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 border-b-2 border-slate-200 pb-2 font-sans px-6 inline-block">
              {studentName}
            </h2>

            <p className="text-sm md:text-base text-slate-600 leading-relaxed">
              concluiu com êxito o <span className="font-semibold text-slate-900">{courseName}</span>,
              ministrado pela plataforma digital <span className="font-semibold text-slate-900">Kingdom Academy</span>,
              {" "}{workloadText}.
            </p>
          </div>

          <div className="z-10 mt-auto w-full border-t border-slate-200/80 pt-8">
            <div className="grid grid-cols-1 items-end gap-8 sm:grid-cols-3 sm:gap-6">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-full max-w-[11rem] items-end justify-center border-b border-slate-400 pb-1">
                  <span className="font-serif text-sm italic text-slate-600">
                    Diogo Nascimento
                  </span>
                </div>
                <p className="mt-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Diretor Executivo
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-full max-w-[13rem] items-end justify-center border-b border-slate-400 pb-1">
                  <span className="text-sm text-slate-600">{completionDate}</span>
                </div>
                <p className="mt-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Data de Conclusão
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-full max-w-[11rem] items-end justify-center border-b border-slate-400 pb-1">
                  <span className="font-mono text-xs text-slate-600">{certificateId}</span>
                </div>
                <p className="mt-2 flex items-center justify-center gap-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  <BadgeCheck className="size-3.5 shrink-0" />
                  ID de Verificação
                </p>
                <div className="mt-3 rounded-md border border-slate-200 bg-white p-1.5">
                  <QRCodeSVG
                    value={getVerificationUrl(certificateId)}
                    size={72}
                    level="M"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
