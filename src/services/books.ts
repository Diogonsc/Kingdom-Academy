import { supabase } from "@/lib/supabase";
import type { Book } from "@/types/database";

export async function fetchBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []) as Book[];
}
