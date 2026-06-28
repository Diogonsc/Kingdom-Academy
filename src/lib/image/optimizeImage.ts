import imageCompression from "browser-image-compression";
import { isLikelyImageFile } from "./acceptImageFile";
import {
  IMAGE_MAX_WIDTH,
  IMAGE_WEBP_QUALITY,
  MAX_IMAGE_INPUT_BYTES,
  MAX_OUTPUT_SIZE_MB,
} from "./constants";
import { FileTooLargeError } from "./imageErrors";
import type { ImagePreset, ImagePresetConfig } from "./presets";
import { IMAGE_PRESETS } from "./presets";

export { FileTooLargeError } from "./imageErrors";

export type OptimizeImageOptions = {
  signal?: AbortSignal;
  preset?: ImagePreset;
  maxWidthOrHeight?: number;
  maxSizeMB?: number;
  initialQuality?: number;
};

function assertNotAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
}

function resolvePresetConfig(options?: OptimizeImageOptions): ImagePresetConfig {
  const preset = options?.preset ? IMAGE_PRESETS[options.preset] : null;

  return {
    maxWidthOrHeight:
      options?.maxWidthOrHeight ?? preset?.maxWidthOrHeight ?? IMAGE_MAX_WIDTH,
    maxSizeMB: options?.maxSizeMB ?? preset?.maxSizeMB ?? MAX_OUTPUT_SIZE_MB,
    initialQuality:
      options?.initialQuality ?? preset?.initialQuality ?? IMAGE_WEBP_QUALITY,
  };
}

function sanitizeBaseName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-") || "image";
}

/**
 * Comprime e converte para WebP no browser.
 * Respeita AbortSignal antes/depois da biblioteca (o worker pode continuar até terminar).
 */
export async function optimizeImage(
  file: File,
  options?: OptimizeImageOptions,
): Promise<File> {
  assertNotAborted(options?.signal);

  if (!isLikelyImageFile(file)) {
    throw new Error("INVALID_IMAGE_TYPE");
  }

  if (file.size > MAX_IMAGE_INPUT_BYTES) {
    throw new FileTooLargeError(MAX_IMAGE_INPUT_BYTES);
  }

  const { maxWidthOrHeight, maxSizeMB, initialQuality } = resolvePresetConfig(options);

  const compressed = await imageCompression(file, {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
    fileType: "image/webp",
    initialQuality,
  });

  assertNotAborted(options?.signal);

  return new File([compressed], `${sanitizeBaseName(file.name)}.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });
}
