import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function CardCourseSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative mx-auto h-[320px] w-full max-w-[300px] overflow-hidden rounded-xl border border-border sm:h-[360px] lg:h-[400px]",
        className,
      )}
    >
      <Skeleton className="absolute inset-0 size-full rounded-none" />
      <div className="absolute inset-x-0 bottom-0 space-y-2 p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-4 h-9 w-full" />
      </div>
    </div>
  );
}

export function CardCourseSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <CardCourseSkeleton key={index} className="mx-0 shrink-0" />
      ))}
    </div>
  );
}

export function BookStoreSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto h-[280px] w-full max-w-[220px] overflow-hidden rounded-xl border border-border",
        className,
      )}
    >
      <Skeleton className="h-[160px] w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function BookStoreSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <BookStoreSkeleton key={index} className="mx-0 shrink-0" />
      ))}
    </div>
  );
}
