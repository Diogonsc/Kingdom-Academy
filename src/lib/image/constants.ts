/** Tamanho máximo do arquivo original antes da compressão (5 MB). */
export const MAX_IMAGE_INPUT_BYTES = 5 * 1024 * 1024;

/** Limite alvo após compressão (MB) — usado pela biblioteca. */
export const MAX_OUTPUT_SIZE_MB = 0.8;

/** Largura/altura máxima padrão (capas de curso e uso geral). */
export const IMAGE_MAX_WIDTH = 1200;

/** Qualidade WebP padrão (~75%). */
export const IMAGE_WEBP_QUALITY = 0.75;

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const ALLOWED_IMAGE_ACCEPT = ALLOWED_IMAGE_MIME_TYPES.join(",");
