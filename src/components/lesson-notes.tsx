import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, StickyNote, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteNote, fetchLessonNotes, saveNote } from "@/services/notes";
import type { LessonNote } from "@/types/database";

type LessonNotesProps = {
  lessonId: string;
};

const DEBOUNCE_MS = 1000;

export function LessonNotes({ lessonId }: LessonNotesProps) {
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLessonNotes(lessonId);
      setNotes(data);
      setContent(data[0]?.content ?? "");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao carregar anotações",
      );
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  async function persistNote(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    setSaving(true);
    try {
      const saved = await saveNote(lessonId, trimmed);
      setNotes((current) => {
        const without = current.filter((note) => note.id !== saved.id);
        return [saved, ...without];
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar anotação",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleContentChange(value: string) {
    setContent(value);

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      void persistNote(value);
    }, DEBOUNCE_MS);
  }

  async function handleDelete(noteId: string) {
    try {
      await deleteNote(noteId);
      setNotes((current) => current.filter((note) => note.id !== noteId));
      if (notes[0]?.id === noteId) {
        setContent("");
      }
      toast.success("Anotação removida");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao remover anotação",
      );
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <StickyNote className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">Anotações</h3>
        </div>
        {saving ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            Salvando...
          </span>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando anotações...</p>
      ) : (
        <>
          {notes.length > 0 ? (
            <ul className="mb-4 space-y-2">
              {notes.map((note) => (
                <li
                  key={note.id}
                  className="rounded-lg border border-border bg-muted/30 p-3 text-sm"
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(note.updated_at).toLocaleString("pt-BR")}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => void handleDelete(note.id)}
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed">{note.content}</p>
                </li>
              ))}
            </ul>
          ) : null}

          <textarea
            value={content}
            onChange={(event) => handleContentChange(event.target.value)}
            placeholder="Escreva suas anotações sobre esta aula..."
            rows={4}
            className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Suas anotações são salvas automaticamente.
          </p>
        </>
      )}
    </section>
  );
}
