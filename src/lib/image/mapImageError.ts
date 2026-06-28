import { MAX_IMAGE_INPUT_BYTES } from "./constants";
import { FileTooLargeError } from "./imageErrors";

function formatMegabytes(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

export function mapImageError(error: unknown): string {
  if (error instanceof FileTooLargeError) {
    return `A imagem deve ter no máximo ${formatMegabytes(error.maxBytes)}.`;
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return "Processamento da imagem cancelado.";
  }

  if (error instanceof Error) {
    if (error.message === "INVALID_IMAGE_TYPE") {
      return "Formato inválido. Use JPG, PNG ou WEBP.";
    }

    if (error.message === "FILE_TOO_LARGE") {
      return `A imagem deve ter no máximo ${formatMegabytes(MAX_IMAGE_INPUT_BYTES)}.`;
    }

    return error.message;
  }

  return "Erro ao processar imagem.";
}
