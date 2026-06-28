import {
  IMAGE_MAX_WIDTH,
  IMAGE_WEBP_QUALITY,
  MAX_OUTPUT_SIZE_MB,
} from "./constants";

export type ImagePreset = "thumbnail" | "banner" | "avatar";

export type ImagePresetConfig = {
  maxWidthOrHeight: number;
  maxSizeMB: number;
  initialQuality: number;
};

export const IMAGE_PRESETS: Record<ImagePreset, ImagePresetConfig> = {
  thumbnail: {
    maxWidthOrHeight: IMAGE_MAX_WIDTH,
    maxSizeMB: MAX_OUTPUT_SIZE_MB,
    initialQuality: IMAGE_WEBP_QUALITY,
  },
  banner: {
    maxWidthOrHeight: 1920,
    maxSizeMB: 1.2,
    initialQuality: 0.78,
  },
  avatar: {
    maxWidthOrHeight: 512,
    maxSizeMB: 0.35,
    initialQuality: 0.8,
  },
};
