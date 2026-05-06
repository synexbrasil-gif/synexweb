"use client"

import { useEffect, useRef, useState } from "react"

interface UseScrollAnimationOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
  revealOnHistoryReturn?: boolean
}

export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(
  options: UseScrollAnimationOptions = {}
) {
  const {
    threshold = 0.05,
    rootMargin = "100px 0px 0px 0px",
    triggerOnce = true,
    revealOnHistoryReturn = false,
  } = options
  const ref = useRef<T>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const isHistoryReturn = () => {
      const navigation = performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined

      return navigation?.type === "back_forward"
    }

    const revealIfInViewport = () => {
      const rect = element.getBoundingClientRect()
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight
      const isInViewport = rect.top < viewportHeight * 0.9 && rect.bottom > 0

      if (isInViewport) {
        setIsVisible(true)
        return true
      }

      return false
    }

    if (revealOnHistoryReturn && isHistoryReturn()) {
      setIsVisible(true)
      return
    }

    let frame = 0
    let observer: IntersectionObserver | undefined

    const checkVisibility = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        const revealed = revealIfInViewport()
        if (revealed && triggerOnce) {
          observer?.disconnect()
          window.removeEventListener("scroll", checkVisibility)
          window.removeEventListener("resize", checkVisibility)
        }
      })
    }

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            if (triggerOnce) {
              observer?.disconnect()
              window.removeEventListener("scroll", checkVisibility)
              window.removeEventListener("resize", checkVisibility)
            }
          } else if (!triggerOnce) {
            setIsVisible(false)
          }
        },
        { threshold, rootMargin }
      )
      observer.observe(element)
    }

    checkVisibility()
    window.addEventListener("scroll", checkVisibility, { passive: true })
    window.addEventListener("resize", checkVisibility)
    const handlePageShow = (event: PageTransitionEvent) => {
      if (revealOnHistoryReturn && (event.persisted || isHistoryReturn())) {
        setIsVisible(true)
        observer?.disconnect()
        return
      }

      checkVisibility()
    }

    window.addEventListener("pageshow", handlePageShow)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener("scroll", checkVisibility)
      window.removeEventListener("resize", checkVisibility)
      window.removeEventListener("pageshow", handlePageShow)
      observer?.disconnect()
    }
  }, [threshold, rootMargin, triggerOnce, revealOnHistoryReturn])

  return { ref, isVisible }
}
