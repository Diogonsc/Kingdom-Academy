import type { BannerLocation } from "@/types/database";

export type BannerSpec = {
  label: string;
  description: string;
  aspectRatio: string;
  recommendedWidth: number;
  recommendedHeight: number;
  minWidth: number;
  minHeight: number;
  maxDisplayHeight: number;
};

export const BANNER_SPECS: Record<BannerLocation, BannerSpec> = {
  dashboard: {
    label: "Dashboard",
    description: "Carrossel exibido no topo da Página Inicial (dashboard).",
    aspectRatio: "16:9",
    recommendedWidth: 1920,
    recommendedHeight: 1080,
    minWidth: 1280,
    minHeight: 720,
    maxDisplayHeight: 400,
  },
  bookstore: {
    label: "Livraria",
    description: "Carrossel exibido no topo da página Livraria.",
    aspectRatio: "16:9",
    recommendedWidth: 1920,
    recommendedHeight: 1080,
    minWidth: 1280,
    minHeight: 720,
    maxDisplayHeight: 400,
  },
};

export function formatBannerDimensions(spec: BannerSpec): string {
  return `${spec.recommendedWidth} × ${spec.recommendedHeight} px (${spec.aspectRatio})`;
}
