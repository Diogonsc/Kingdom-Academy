import { useRef, useState } from "react";
import { FileDown, ImageDown, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  buildCertificateFilename,
  downloadCertificateAsPdf,
  downloadCertificateAsPng,
} from "@/lib/export-certificate";
import Certificate from "./certificate";

type CertificateModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  courseName: string;
  issuedAt: string;
  durationHours: number;
  certificateId: string;
};

type ExportFormat = "png" | "pdf";

export function CertificateModal({
  open,
  onOpenChange,
  studentName,
  courseName,
  issuedAt,
  durationHours,
  certificateId,
}: CertificateModalProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  const formattedDate = new Date(issuedAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  async function handleExport(format: ExportFormat) {
    const element = certificateRef.current?.querySelector<HTMLElement>(
      "#certificate-export",
    );

    if (!element) {
      toast.error("Não foi possível localizar o certificado para exportação.");
      return;
    }

    setExporting(format);

    try {
      const filename = buildCertificateFilename(studentName, courseName, format);

      if (format === "png") {
        await downloadCertificateAsPng(element, filename);
        toast.success("Certificado baixado em PNG.");
      } else {
        await downloadCertificateAsPdf(element, filename);
        toast.success("Certificado baixado em PDF.");
      }
    } catch {
      toast.error("Erro ao gerar o arquivo. Tente novamente.");
    } finally {
      setExporting(null);
    }
  }

  const isExporting = exporting !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(96vw,960px)] gap-4 overflow-y-auto print:max-w-none print:border-0 print:p-0 print:shadow-none">
        <DialogHeader className="print:hidden">
          <DialogTitle>Certificado de Conclusão</DialogTitle>
        </DialogHeader>

        <div id="certificate-print-area" ref={certificateRef}>
          <Certificate
            studentName={studentName}
            courseName={courseName}
            completionDate={formattedDate}
            durationHours={durationHours}
            certificateId={certificateId}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2 print:hidden">
          <Button
            type="button"
            variant="outline"
            disabled={isExporting}
            onClick={() => void handleExport("png")}
            className="gap-2"
          >
            {exporting === "png" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ImageDown className="size-4" />
            )}
            Baixar PNG
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={isExporting}
            onClick={() => void handleExport("pdf")}
            className="gap-2"
          >
            {exporting === "pdf" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileDown className="size-4" />
            )}
            Baixar PDF
          </Button>

          <Button
            type="button"
            disabled={isExporting}
            onClick={() => window.print()}
            className="gap-2"
          >
            <Printer className="size-4" />
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
