import { useEffect, useRef, useState } from "react"

import { CardCourse } from "@/components/card-course"
import type { CardCourseSchema } from "@/components/card-course/schema"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { useSidebar } from "@/components/ui/sidebar"

const SIDEBAR_TRANSITION_MS = 250

type CourseCarouselProps = {
  courses: CardCourseSchema[]
  showEnrollmentLock?: boolean
  onEnrolled?: () => void
}

export function CourseCarousel({ courses, showEnrollmentLock = false, onEnrolled }: CourseCarouselProps) {
  const [api, setApi] = useState<CarouselApi>()
  const containerRef = useRef<HTMLDivElement>(null)
  const { state, isMobile } = useSidebar()

  useEffect(() => {
    if (!api) {
      return
    }

    const timeout = window.setTimeout(() => {
      api.reInit()
    }, SIDEBAR_TRANSITION_MS)

    return () => window.clearTimeout(timeout)
  }, [api, state, isMobile])

  useEffect(() => {
    if (!api || !containerRef.current) {
      return
    }

    const observer = new ResizeObserver(() => {
      api.reInit()
    })

    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [api])

  return (
    <div ref={containerRef} className="relative w-full">
      <Carousel
        setApi={setApi}
        opts={{ align: "start", watchResize: true }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {courses.map((course) => (
            <CarouselItem
              key={course.id ?? course.title}
              className="basis-[85%] pl-4 sm:basis-[300px]"
            >
              <CardCourse
                course={course}
                showEnrollmentLock={showEnrollmentLock}
                onEnrolled={onEnrolled}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  )
}
