import { BannerLocationSection } from "@/components/admin/banner-location-section";

export function AdminBannersPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Banners</h1>
        <p className="text-muted-foreground">
          Gerencie os carrosséis exibidos no Dashboard e na Livraria. Use imagens
          em 1920 × 1080 px (16:9) para melhor qualidade.
        </p>
      </div>

      <BannerLocationSection location="dashboard" />
      <BannerLocationSection location="bookstore" />
    </div>
  );
}
