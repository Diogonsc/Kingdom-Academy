import { supabase } from "@/lib/supabase";
import type { BannerLocation, SiteBanner } from "@/types/database";

function isMissingSchemaError(error: { code?: string; message?: string }): boolean {
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    (error.message?.includes("schema cache") ?? false) ||
    (error.message?.includes("does not exist") ?? false)
  );
}

export async function fetchBannersByLocation(
  location: BannerLocation,
  options?: { includeInactive?: boolean },
): Promise<SiteBanner[]> {
  try {
    let query = supabase
      .from("site_banners")
      .select("*")
      .eq("location", location)
      .order("order_index", { ascending: true });

    if (!options?.includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) {
      if (isMissingSchemaError(error)) return [];
      throw new Error(error.message);
    }

    return (data ?? []) as SiteBanner[];
  } catch (error) {
    if (error instanceof Error && isMissingSchemaError(error)) return [];
    console.error("Erro ao buscar banners:", error);
    throw error instanceof Error ? error : new Error("Erro ao buscar banners.");
  }
}

export async function createBanner(input: {
  location: BannerLocation;
  imageUrl: string;
  altText: string;
  link?: string | null;
  orderIndex: number;
}): Promise<SiteBanner> {
  const { data, error } = await supabase
    .from("site_banners")
    .insert({
      location: input.location,
      image_url: input.imageUrl,
      alt_text: input.altText,
      link: input.link ?? null,
      order_index: input.orderIndex,
    })
    .select("*")
    .single();

  if (error) {
    if (isMissingSchemaError(error)) {
      throw new Error(
        "Banners não disponíveis. Execute a migração supabase/banners.sql no Supabase.",
      );
    }
    throw new Error(error.message);
  }

  return data as SiteBanner;
}

export async function updateBanner(
  id: string,
  input: Partial<Pick<SiteBanner, "alt_text" | "link" | "is_active" | "order_index">>,
): Promise<void> {
  const { error } = await supabase.from("site_banners").update(input).eq("id", id);

  if (error) throw new Error(error.message);
}

export async function deleteBanner(id: string): Promise<void> {
  const { error } = await supabase.from("site_banners").delete().eq("id", id);

  if (error) throw new Error(error.message);
}

export async function getNextBannerOrderIndex(location: BannerLocation): Promise<number> {
  const banners = await fetchBannersByLocation(location, { includeInactive: true });
  if (banners.length === 0) return 0;
  return Math.max(...banners.map((banner) => banner.order_index)) + 1;
}
