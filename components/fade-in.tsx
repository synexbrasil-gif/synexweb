"use client"

import { cn } from "@/lib/utils"
import { type HTMLAttributes, type ReactNode } from "react"

interface FadeInProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  delay?: number
  direction?: "up" | "down" | "left" | "right" | "none"
  duration?: number
  loadOnScroll?: boolean
}

export function FadeIn({
  children,
  className,
  delay = 0,
  direction = "up",
  duration = 700,
  loadOnScroll,
  style,
  ...props
}: FadeInProps) {
  const animationNames = {
    up: "synex-fade-in-up",
    down: "synex-fade-in-down",
    left: "synex-fade-in-left",
    right: "synex-fade-in-right",
    none: "synex-fade-in",
  }

  return (
    <div
      className={cn("opacity-100 translate-x-0 translate-y-0", className)}
      data-load-on-scroll={loadOnScroll ? "" : undefined}
      style={{
        ...style,
        animation: `${animationNames[direction]} ${duration}ms ease-out ${delay}ms both`,
      }}
      {...props}
    >
      {children}
    </div>
  )
}
