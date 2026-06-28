import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { BannerUploadForm } from "@/components/admin/banner-upload-form";
import { Loading } from "@/components/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BANNER_SPECS, formatBannerDimensions } from "@/lib/banner-specs";
import {
  deleteBanner,
  fetchBannersByLocation,
  updateBanner,
} from "@/services/banners";
import type { BannerLocation, SiteBanner } from "@/types/database";

type BannerLocationSectionProps = {
  location: BannerLocation;
};

export function BannerLocationSection({ location }: BannerLocationSectionProps) {
  const spec = BANNER_SPECS[location];
  const [banners, setBanners] = useState<SiteBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerToDelete, setBannerToDelete] = useState<SiteBanner | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadBanners = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchBannersByLocation(location, {
        includeInactive: true,
      });
      setBanners(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao carregar banners",
      );
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    void loadBanners();
  }, [loadBanners]);

  async function handleToggleActive(banner: SiteBanner) {
    setTogglingId(banner.id);

    try {
      await updateBanner(banner.id, { is_active: !banner.is_active });
      await loadBanners();
      toast.success(
        banner.is_active ? "Banner ocultado." : "Banner exibido novamente.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar banner",
      );
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete() {
    if (!bannerToDelete) return;

    setDeleting(true);

    try {
      await deleteBanner(bannerToDelete.id);
      toast.success("Banner removido.");
      setBannerToDelete(null);
      await loadBanners();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao remover banner",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Banner — {spec.label}</CardTitle>
          <CardDescription>
            {spec.description} Dimensão ideal:{" "}
            <strong>{formatBannerDimensions(spec)}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <BannerUploadForm location={location} onCreated={loadBanners} />

          <div className="space-y-3">
            <h3 className="text-sm font-medium">
              Banners cadastrados ({banners.length})
            </h3>

            {loading ? (
              <Loading message="Carregando banners..." />
            ) : banners.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum banner cadastrado. Os banners padrão do sistema serão
                exibidos até você adicionar imagens aqui.
              </p>
            ) : (
              <div className="grid gap-3">
                {banners.map((banner) => (
                  <div
                    key={banner.id}
                    className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center"
                  >
                    <div className="aspect-[16/9] w-full max-w-[240px] overflow-hidden rounded-md bg-muted">
                      <img
                        src={banner.image_url}
                        alt={banner.alt_text}
                        className="size-full object-cover"
                      />
                    </div>

                    <div className="flex flex-1 flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{banner.alt_text}</p>
                        <Badge variant={banner.is_active ? "default" : "secondary"}>
                          {banner.is_active ? "Ativo" : "Oculto"}
                        </Badge>
                      </div>

                      {banner.link ? (
                        <a
                          href={banner.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          {banner.link}
                          <ExternalLink className="size-3" />
                        </a>
                      ) : (
                        <p className="text-xs text-muted-foreground">Sem link</p>
                      )}
                    </div>

                    <div className="flex gap-2 sm:flex-col">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={togglingId === banner.id}
                        onClick={() => void handleToggleActive(banner)}
                        className="gap-1.5"
                      >
                        {banner.is_active ? (
                          <>
                            <EyeOff className="size-3.5" />
                            Ocultar
                          </>
                        ) : (
                          <>
                            <Eye className="size-3.5" />
                            Exibir
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setBannerToDelete(banner)}
                        className="gap-1.5 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={bannerToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setBannerToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir banner</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O banner será removido
              permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBannerToDelete(null)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={deleting}
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
