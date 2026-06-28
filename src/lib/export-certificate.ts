import { toCanvas, toPng } from "html-to-image";
import { jsPDF } from "jspdf";

const EXPORT_OPTIONS = {
  pixelRatio: 2,
  cacheBust: true,
  backgroundColor: "#ffffff",
} as const;

function triggerDownload(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export function buildCertificateFilename(
  studentName: string,
  courseName: string,
  extension: "png" | "pdf",
) {
  const slug = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  return `certificado-${slug(studentName)}-${slug(courseName)}.${extension}`;
}

export async function downloadCertificateAsPng(
  element: HTMLElement,
  filename: string,
) {
  const dataUrl = await toPng(element, EXPORT_OPTIONS);
  triggerDownload(dataUrl, filename);
}

export async function downloadCertificateAsPdf(
  element: HTMLElement,
  filename: string,
) {
  const canvas = await toCanvas(element, EXPORT_OPTIONS);
  const imgData = canvas.toDataURL("image/png");
  const { width, height } = canvas;

  const pdf = new jsPDF({
    orientation: width > height ? "landscape" : "portrait",
    unit: "px",
    format: [width, height],
  });

  pdf.addImage(imgData, "PNG", 0, 0, width, height);
  pdf.save(filename);
}
