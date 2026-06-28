import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BANNER_SPECS,
  formatBannerDimensions,
} from "@/lib/banner-specs";
import { ALLOWED_IMAGE_ACCEPT, mapImageError, validateImageInput } from "@/lib/image";
import { cn } from "@/lib/utils";
import {
  createBanner,
  getNextBannerOrderIndex,
} from "@/services/banners";
import { uploadSiteBanner } from "@/services/storage";
import type { BannerLocation } from "@/types/database";

type BannerUploadFormProps = {
  location: BannerLocation;
  onCreated: () => void;
  disabled?: boolean;
};

export function BannerUploadForm({
  location,
  onCreated,
  disabled = false,
}: BannerUploadFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [altText, setAltText] = useState("");
  const [link, setLink] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const spec = BANNER_SPECS[location];

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    try {
      validateImageInput(file);

      if (preview) URL.revokeObjectURL(preview);

      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));

      if (!altText.trim()) {
        setAltText(`Banner ${spec.label}`);
      }
    } catch (error) {
      toast.error(mapImageError(error));
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!selectedFile) {
      toast.error("Selecione uma imagem para o banner.");
      return;
    }

    if (!altText.trim()) {
      toast.error("Informe um texto alternativo para acessibilidade.");
      return;
    }

    setUploading(true);

    try {
      const imageUrl = await uploadSiteBanner(selectedFile, location);
      const orderIndex = await getNextBannerOrderIndex(location);

      await createBanner({
        location,
        imageUrl,
        altText: altText.trim(),
        link: link.trim() || null,
        orderIndex,
      });

      toast.success("Banner adicionado com sucesso.");

      if (preview) URL.revokeObjectURL(preview);

      setPreview(null);
      setSelectedFile(null);
      setAltText("");
      setLink("");
      onCreated();
    } catch (error) {
      toast.error(mapImageError(error));
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      <div className="rounded-lg border bg-muted/30 p-4 text-sm">
        <p className="font-medium">Dimensões recomendadas</p>
        <p className="mt-1 text-muted-foreground">
          {formatBannerDimensions(spec)} — proporção {spec.aspectRatio}, altura
          máxima de exibição {spec.maxDisplayHeight}px.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Mínimo aceitável: {spec.minWidth} × {spec.minHeight} px. Formatos: JPG,
          PNG ou WEBP (até 5 MB). Otimizado automaticamente para WebP (máx. 1920px).
        </p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div
          className={cn(
            "relative aspect-[16/9] w-full overflow-hidden rounded-lg border bg-muted",
            "max-h-[200px] max-w-[356px]",
          )}
        >
          {preview ? (
            <img
              src={preview}
              alt="Pré-visualização do banner"
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <ImagePlus className="size-8 stroke-[1.5]" />
              <span className="text-xs">Pré-visualização 16:9</span>
            </div>
          )}
          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Loader2 className="size-6 animate-spin text-white" />
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_IMAGE_ACCEPT}
            className="hidden"
            disabled={disabled || uploading}
            onChange={handleFileChange}
          />

          <Button
            type="button"
            variant="outline"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            className="w-fit gap-2"
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ImagePlus className="size-4" />
            )}
            {preview ? "Trocar imagem" : "Selecionar imagem"}
          </Button>

          <div className="space-y-2">
            <Label htmlFor={`alt-${location}`}>Texto alternativo</Label>
            <Input
              id={`alt-${location}`}
              value={altText}
              onChange={(event) => setAltText(event.target.value)}
              placeholder="Descrição do banner para leitores de tela"
              disabled={disabled || uploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`link-${location}`}>Link (opcional)</Label>
            <Input
              id={`link-${location}`}
              type="url"
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="https://..."
              disabled={disabled || uploading}
            />
          </div>

          <Button
            type="submit"
            disabled={disabled || uploading || !selectedFile}
            className="w-fit"
          >
            {uploading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Otimizando e enviando...
              </>
            ) : (
              "Adicionar banner"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
