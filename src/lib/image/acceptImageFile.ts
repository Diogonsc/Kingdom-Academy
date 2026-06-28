import { ALLOWED_IMAGE_MIME_TYPES } from "./constants";

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;

export function isLikelyImageFile(file: File): boolean {
  if (ALLOWED_IMAGE_MIME_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    return true;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension !== undefined && ALLOWED_EXTENSIONS.includes(extension as (typeof ALLOWED_EXTENSIONS)[number]);
}
