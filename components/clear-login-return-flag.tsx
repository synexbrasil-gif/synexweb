"use client"

import { useEffect } from "react"

export const LOGIN_RETURN_FLAG = "synex-returned-from-login"

export function ClearLoginReturnFlag() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      sessionStorage.removeItem(LOGIN_RETURN_FLAG)
    }, 5000)

    return () => {
      window.clearTimeout(timer)
    }
  }, [])

  return null
}
