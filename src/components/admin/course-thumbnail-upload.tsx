import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ALLOWED_IMAGE_ACCEPT, mapImageError, validateImageInput } from "@/lib/image";
import { uploadCourseThumbnail } from "@/services/storage";

type CourseThumbnailUploadProps = {
  value?: string | null;
  courseId?: string;
  onChange: (url: string) => void;
  onFileSelect?: (file: File | null) => void;
  disabled?: boolean;
  className?: string;
};

export function CourseThumbnailUpload({
  value,
  courseId,
  onChange,
  onFileSelect,
  disabled = false,
  className,
}: CourseThumbnailUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const preview = localPreview ?? value ?? null;

  useEffect(() => {
    return () => {
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    try {
      validateImageInput(file);

      if (courseId) {
        setUploading(true);
        const url = await uploadCourseThumbnail(file, courseId);
        onChange(url);
        onFileSelect?.(null);

        if (localPreview) {
          URL.revokeObjectURL(localPreview);
          setLocalPreview(null);
        }
      } else {
        if (localPreview) {
          URL.revokeObjectURL(localPreview);
        }

        setLocalPreview(URL.createObjectURL(file));
        onFileSelect?.(file);
      }
    } catch (error) {
      onFileSelect?.(null);
      toast.error(mapImageError(error));
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
    }

    onChange("");
    onFileSelect?.(null);
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label>Imagem de capa</Label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="relative aspect-video w-full max-w-xs overflow-hidden rounded-lg border bg-muted">
          {preview ? (
            <img
              src={preview}
              alt="Pré-visualização da capa do curso"
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <Camera className="size-10 stroke-[1.5]" />
              <span className="text-xs">Nenhuma capa selecionada</span>
            </div>
          )}
          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Loader2 className="size-6 animate-spin text-white" />
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_IMAGE_ACCEPT}
            className="hidden"
            disabled={disabled || uploading}
            onChange={(event) => {
              void handleFileChange(event).catch((error) => {
                console.error(error);
              });
            }}
          />

          <Button
            type="button"
            variant="outline"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            className="gap-2"
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ImagePlus className="size-4" />
            )}
            {uploading ? "Otimizando..." : preview ? "Trocar imagem" : "Selecionar imagem"}
          </Button>

          {preview ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || uploading}
              onClick={handleRemove}
              className="justify-start gap-2 px-0 text-muted-foreground hover:text-destructive"
            >
              <X className="size-4" />
              Remover capa
            </Button>
          ) : null}

          <p className="text-xs text-muted-foreground">
            JPG, PNG ou WEBP (até 5 MB). Convertido automaticamente para WebP otimizado (máx. 1200px).
          </p>
        </div>
      </div>
    </div>
  );
}

export async function uploadPendingCourseThumbnail(
  file: File,
  courseId: string,
): Promise<string> {
  return uploadCourseThumbnail(file, courseId);
}
