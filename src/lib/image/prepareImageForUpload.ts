import { MAX_IMAGE_INPUT_BYTES } from "./constants";
import { isLikelyImageFile } from "./acceptImageFile";
import { FileTooLargeError } from "./imageErrors";
import { optimizeImage, type OptimizeImageOptions } from "./optimizeImage";
import type { ImagePreset } from "./presets";

export function validateImageInput(file: File): void {
  if (!isLikelyImageFile(file)) {
    throw new Error("INVALID_IMAGE_TYPE");
  }

  if (file.size > MAX_IMAGE_INPUT_BYTES) {
    throw new FileTooLargeError(MAX_IMAGE_INPUT_BYTES);
  }
}

export async function prepareImageForUpload(
  file: File,
  preset: ImagePreset,
  options?: Omit<OptimizeImageOptions, "preset">,
): Promise<File> {
  validateImageInput(file);
  return optimizeImage(file, { ...options, preset });
}
