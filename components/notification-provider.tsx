"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { Bell } from "lucide-react"

import { cn } from "@/lib/utils"

type NotificationTone = "default" | "success" | "error"

type Notification = {
  id: string
  title: string
  description?: string
  tone: NotificationTone
}

type NotificationContextValue = {
  notify: (notification: Omit<Notification, "id">) => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

function playBlip() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    const audioContext = new AudioContext()
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()

    oscillator.type = "sine"
    oscillator.frequency.setValueAtTime(740, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(980, audioContext.currentTime + 0.08)
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.16)

    oscillator.connect(gain)
    gain.connect(audioContext.destination)
    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.17)

    window.setTimeout(() => void audioContext.close(), 260)
  } catch {
    return
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const notify = useCallback((notification: Omit<Notification, "id">) => {
    const id = crypto.randomUUID()
    playBlip()

    setNotifications((current) => [{ ...notification, id }, ...current].slice(0, 4))
    window.setTimeout(() => {
      setNotifications((current) => current.filter((item) => item.id !== id))
    }, 4200)
  }, [])

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex w-[min(calc(100vw-2rem),24rem)] flex-col gap-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              "animate-notification-in flex gap-3 rounded-xl border border-border/70 bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.96_0_0)_100%)] p-4 shadow-2xl shadow-foreground/10",
            )}
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
              <Bell className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{notification.title}</p>
              {notification.description && (
                <p className="mt-1 text-sm leading-5 text-muted-foreground">{notification.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)

  if (!context) {
    throw new Error("useNotification must be used inside NotificationProvider")
  }

  return context
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}
