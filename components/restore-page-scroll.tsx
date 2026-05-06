"use client"

import { useEffect } from "react"

export function RestorePageScroll() {
  useEffect(() => {
    const restoreScroll = () => {
      document.documentElement.style.overflowY = "auto"
      document.body.style.overflowY = "auto"
    }

    restoreScroll()
    window.addEventListener("pageshow", restoreScroll)

    return () => {
      window.removeEventListener("pageshow", restoreScroll)
    }
  }, [])

  return null
}
