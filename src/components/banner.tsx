import { useEffect, useRef, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { fetchBannersByLocation } from "@/services/banners";
import type { BannerLocation } from "@/types/database";
import { Card } from "./ui/card";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselDots,
  CarouselItem,
} from "./ui/carousel";

const AUTOPLAY_DELAY_MS = 7000;
const SCROLL_DURATION_MS = 30;

type BannerSlide = {
  src: string;
  alt: string;
  link?: string | null;
};

type BannerProps = {
  location: BannerLocation;
};

export function Banner({ location }: BannerProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [slides, setSlides] = useState<BannerSlide[] | null>(null);
  const isPausedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadBanners() {
      const banners = await fetchBannersByLocation(location);

      setSlides(
        banners.map((banner) => ({
          src: banner.image_url,
          alt: banner.alt_text,
          link: banner.link,
        })),
      );
    }

    void loadBanners().catch((error) => {
      console.error("Erro ao carregar banners:", error);
      setSlides([]);
    });
  }, [location]);

  useEffect(() => {
    if (!api) {
      return;
    }

    const interval = window.setInterval(() => {
      if (isPausedRef.current) {
        return;
      }

      api.scrollNext();
    }, AUTOPLAY_DELAY_MS);

    return () => window.clearInterval(interval);
  }, [api]);

  useEffect(() => {
    if (!api || !containerRef.current) {
      return;
    }

    const observer = new ResizeObserver(() => {
      api.reInit();
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [api]);

  if (slides === null) {
    return (
      <div className="w-full">
        <Skeleton className="aspect-[16/9] w-full max-h-[400px] rounded-xl" />
      </div>
    );
  }

  if (slides.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className="w-full">
      <Card
        className="relative aspect-[16/9] w-full max-h-[400px] overflow-hidden border-0 p-0 shadow-sm ring-1 ring-border/40 dark:shadow-none dark:ring-foreground/10"
        onMouseEnter={() => {
          isPausedRef.current = true;
        }}
        onMouseLeave={() => {
          isPausedRef.current = false;
        }}
      >
        <Carousel
          setApi={setApi}
          opts={{
            loop: slides.length > 1,
            align: "start",
            duration: SCROLL_DURATION_MS,
            watchResize: true,
          }}
          className="absolute inset-0 size-full"
        >
          <CarouselContent className="ml-0 h-full">
            {slides.map((image, index) => (
              <CarouselItem
                key={`${image.src}-${index}`}
                className="h-full basis-full pl-0"
              >
                {image.link ? (
                  <a
                    href={image.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block size-full"
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="size-full object-cover"
                    />
                  </a>
                ) : (
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="size-full object-cover"
                  />
                )}
              </CarouselItem>
            ))}
          </CarouselContent>
          {slides.length > 1 ? (
            <CarouselDots className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2" />
          ) : null}
        </Carousel>
      </Card>
    </div>
  );
}
