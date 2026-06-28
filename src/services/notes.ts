import { supabase } from "@/lib/supabase";
import type { LessonNote } from "@/types/database";

export async function fetchLessonNotes(lessonId: string): Promise<LessonNote[]> {
  const { data, error } = await supabase
    .from("lesson_notes")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as LessonNote[];
}

export async function saveNote(
  lessonId: string,
  content: string,
): Promise<LessonNote> {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error("A anotação não pode estar vazia");
  }

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    throw new Error("Usuário não autenticado");
  }

  const { data: existing } = await supabase
    .from("lesson_notes")
    .select("id")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (existing?.id) {
    const { data, error } = await supabase
      .from("lesson_notes")
      .update({ content: trimmed, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data as LessonNote;
  }

  const { data, error } = await supabase
    .from("lesson_notes")
    .insert({ user_id: userId, lesson_id: lessonId, content: trimmed })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as LessonNote;
}

export async function deleteNote(noteId: string): Promise<void> {
  const { error } = await supabase.from("lesson_notes").delete().eq("id", noteId);

  if (error) {
    throw new Error(error.message);
  }
}
