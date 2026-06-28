import { supabase } from "@/lib/supabase";
import type { Profile, UserRole } from "@/types/database";

export async function fetchProfileById(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Profile | null;
}

export async function fetchAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Profile[];
}

export async function updateProfileRole(
  id: string,
  role: UserRole,
): Promise<void> {
  const { error } = await supabase.from("profiles").update({ role }).eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateProfile(
  id: string,
  updates: Pick<Profile, "name" | "avatar_url">,
): Promise<void> {
  const { error } = await supabase.from("profiles").update(updates).eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
