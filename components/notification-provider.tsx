"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { AlertCircle, CheckCircle2, Info } from "lucide-react"

import { cn } from "@/lib/utils"

type NotificationTone = "default" | "success" | "error" | "info"

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

const notificationStyles: Record<
  NotificationTone,
  {
    icon: typeof Info
    iconClassName: string
    className: string
    accentClassName: string
  }
> = {
  default: {
    icon: Info,
    iconClassName: "text-foreground",
    className: "border-border/70 bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.95_0_0)_100%)]",
    accentClassName: "bg-[linear-gradient(180deg,oklch(0.4_0_0),oklch(0.75_0_0))]",
  },
  info: {
    icon: Info,
    iconClassName: "text-foreground",
    className: "border-border/70 bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.95_0_0)_100%)]",
    accentClassName: "bg-[linear-gradient(180deg,oklch(0.4_0_0),oklch(0.75_0_0))]",
  },
  success: {
    icon: CheckCircle2,
    iconClassName: "text-foreground",
    className: "border-border/70 bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.95_0_0)_100%)]",
    accentClassName: "bg-[linear-gradient(180deg,oklch(0.4_0_0),oklch(0.75_0_0))]",
  },
  error: {
    icon: AlertCircle,
    iconClassName: "text-foreground",
    className: "border-border/70 bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.95_0_0)_100%)]",
    accentClassName: "bg-[linear-gradient(180deg,oklch(0.4_0_0),oklch(0.75_0_0))]",
  },
}

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

    setNotifications((current) => {
      const existingIndex = current.findIndex((item) => {
        return item.title === notification.title && item.description === notification.description && item.tone === notification.tone
      })

      playBlip()

      if (existingIndex >= 0) {
        return current.map((item, index) => (index === existingIndex ? { ...notification, id } : item))
      }

      return [{ ...notification, id }, ...current].slice(0, 4)
    })
    window.setTimeout(() => {
      setNotifications((current) => current.filter((item) => item.id !== id))
    }, 4200)
  }, [])

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex w-[min(calc(100vw-2rem),24rem)] flex-col gap-2.5">
        {notifications.map((notification) => {
          const style = notificationStyles[notification.tone]
          const Icon = style.icon

          return (
            <div
              key={notification.id}
              className={cn(
                "animate-notification-in overflow-hidden rounded-lg border shadow-xl shadow-foreground/10 backdrop-blur-xl",
                style.className,
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className={cn("h-full min-h-14 w-1 shrink-0", style.accentClassName)} />
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-background/75 shadow-sm">
                  <Icon className={cn("h-4.5 w-4.5", style.iconClassName)} />
                </span>
                <div className="min-w-0 py-2.5 pr-3.5">
                  <p className="truncate text-sm font-semibold leading-5 tracking-normal text-foreground">
                    {notification.title}
                  </p>
                  {notification.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs leading-4 text-muted-foreground">
                      {notification.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
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
