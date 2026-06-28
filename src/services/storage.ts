import { prepareImageForUpload, type ImagePreset } from "@/lib/image";
import { supabase } from "@/lib/supabase";

const COURSE_THUMBNAILS_BUCKET = "course-thumbnails";
const AVATARS_BUCKET = "avatars";
const SITE_BANNERS_BUCKET = "site-banners";

async function uploadOptimizedImage(
  bucket: string,
  pathPrefix: string,
  file: File,
  preset: ImagePreset,
): Promise<string> {
  const optimized = await prepareImageForUpload(file, preset);
  const path = `${pathPrefix}/${Date.now()}.webp`;

  const { error } = await supabase.storage.from(bucket).upload(path, optimized, {
    cacheControl: "3600",
    upsert: true,
    contentType: optimized.type,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return data.publicUrl;
}

export async function uploadCourseThumbnail(
  file: File,
  courseId: string,
): Promise<string> {
  return uploadOptimizedImage(COURSE_THUMBNAILS_BUCKET, courseId, file, "thumbnail");
}

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  return uploadOptimizedImage(AVATARS_BUCKET, userId, file, "avatar");
}

export async function uploadSiteBanner(
  file: File,
  location: string,
): Promise<string> {
  return uploadOptimizedImage(SITE_BANNERS_BUCKET, location, file, "banner");
}

/** @deprecated Use validateImageInput from @/lib/image */
export { validateImageInput as validateCourseThumbnailFile } from "@/lib/image";
