"use client"

import { useEffect, useState, useRef, useCallback, useMemo, useDeferredValue } from "react"
import { useRouter } from "next/navigation"
import Hls from "hls.js"
import { 
  IPTV_SERVERS, 
  buildAccountApiUrl,
  buildApiUrl, 
  buildStreamUrl,
  type Category,
  type Channel 
} from "@/lib/iptv-config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FadeIn } from "@/components/fade-in"
import { cn } from "@/lib/utils"
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize,
  Minimize,
  LogOut, 
  Search,
  Menu,
  User,
  RefreshCw,
  Settings,
  RotateCcw,
  Captions,
  Cast,
  PictureInPicture2,
  X,
  AlertCircle
} from "lucide-react"

type RemotePlaybackVideo = HTMLVideoElement & {
  remote?: {
    prompt: () => Promise<void>
    state?: "connecting" | "connected" | "disconnected"
  }
}

type MobileFullscreenVideo = HTMLVideoElement & {
  webkitDisplayingFullscreen?: boolean
  webkitEnterFullscreen?: () => void
  webkitExitFullscreen?: () => void
}

type FullscreenContainer = HTMLDivElement & {
  webkitRequestFullscreen?: () => Promise<void> | void
  msRequestFullscreen?: () => Promise<void> | void
}

type FullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void
  webkitFullscreenElement?: Element | null
  msExitFullscreen?: () => Promise<void> | void
  msFullscreenElement?: Element | null
}

type AccountInfo = {
  user_info?: {
    username?: string
    package?: string
    package_name?: string
    plan?: string
    plan_name?: string
    subscription?: string
    status?: string
    exp_date?: string | number
    is_trial?: string | number
    active_cons?: string | number
    max_connections?: string | number
    created_at?: string | number
  }
}

const CHANNEL_FILTER_TERMS = ["ppv", "pay per view", "pay-per-view", "disney", "paramount", "nba", "premiere", "amazon", "espn", "hbo", "cazetv", "caze tv", "goat", "ufc", "dazn", "ge tv", "ge fast", "globo"]
const BLACK_LOGO_TERMS = ["ppv", "pay per view", "pay-per-view", "disney", "paramount", "nba", "esporte", "esportes"]
const PPV_CATEGORY_TERMS = ["ppv", "pay per view", "pay-per-view"]
const SPORTS_CATEGORY_TERMS = ["esporte", "esportes"]
const MOVIES_SERIES_CATEGORY_TERMS = ["filmes e series", "filmes series", "filmes", "series"]
const HIDDEN_CATEGORY_TERMS = ["esporte", "esportes", "variedades", "noticias"]
const SYNTHETIC_CATEGORY_TERMS = ["cazetv", "caze tv", "goat", "ufc", "dazn"]
const SYNEX_SPORTS_CATEGORY_ID = "__synex_esportes__"
const SYNEX_HBO_MAX_CATEGORY_ID = "__synex_hbo_max__"
const SYNEX_CAZETV_CATEGORY_ID = "__synex_cazetv__"
const SYNEX_GOAT_CATEGORY_ID = "__synex_goat__"
const SYNEX_UFC_CATEGORY_ID = "__synex_ufc__"
const SYNEX_DAZN_CATEGORY_ID = "__synex_dazn__"
const SYNEX_GLOBO_CATEGORY_ID = "__synex_globo__"

function normalizeFilterText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function matchesChannelFilter(...values: string[]) {
  const haystack = normalizeFilterText(values.join(" "))
  return CHANNEL_FILTER_TERMS.some((term) => haystack.includes(term))
}

function matchesTerms(terms: string[], ...values: string[]) {
  const haystack = normalizeFilterText(values.join(" "))
  return terms.some((term) => haystack.includes(term))
}

function isPpvCategory(...values: string[]) {
  return matchesTerms(PPV_CATEGORY_TERMS, ...values)
}

function isSportsCategory(...values: string[]) {
  return matchesTerms(SPORTS_CATEGORY_TERMS, ...values)
}

function isMoviesSeriesCategory(...values: string[]) {
  return matchesTerms(MOVIES_SERIES_CATEGORY_TERMS, ...values)
}

function isHiddenCategory(...values: string[]) {
  return matchesTerms(HIDDEN_CATEGORY_TERMS, ...values)
}

function isSyntheticRequestedCategory(...values: string[]) {
  return matchesTerms(SYNTHETIC_CATEGORY_TERMS, ...values)
}

function getSportsMaxChannelNumber(...values: string[]) {
  const haystack = normalizeFilterText(values.join(" "))
  if (!/\bmax\b/.test(haystack)) return null

  const match = haystack.match(/\b0?([1-7])\b/)
  if (!match) return null

  return match[1].padStart(2, "0")
}

function formatHboMaxChannelName(channelNumber: string) {
  return `HBO Max ${channelNumber}`
}

function getNumberedChannelMatch(name: string, pattern: RegExp, maxNumber: number) {
  const haystack = normalizeFilterText(name)
  const match = haystack.match(pattern)
  if (!match) return null

  const channelNumber = Number(match[1])
  if (!Number.isInteger(channelNumber) || channelNumber < 1 || channelNumber > maxNumber) return null

  return String(channelNumber).padStart(2, "0")
}

function getRequestedChannelMapping(name: string, globoCategoryId: string) {
  const normalizedName = normalizeFilterText(name)
  const cazeTvNumber = getNumberedChannelMatch(name, /\bcaze\s*tv\b\D*0?([1-3])\b/, 3)
  const goatNumber = getNumberedChannelMatch(name, /\bgoat\b\D*0?([1-3])\b/, 3)
  const daznNumber = getNumberedChannelMatch(name, /\bdazn\b\D*0?([1-3])\b/, 3)
  const geVariant = normalizedName.match(/\bge\s*(tv|fast)\b.*\b(fhd|hd|sd)\b/)

  if (cazeTvNumber) return { categoryId: SYNEX_CAZETV_CATEGORY_ID, categoryName: "CazeTV", channelName: `CazeTV ${cazeTvNumber}` }
  if (goatNumber) return { categoryId: SYNEX_GOAT_CATEGORY_ID, categoryName: "GOAT", channelName: `Goat ${goatNumber}` }
  if (daznNumber) return { categoryId: SYNEX_DAZN_CATEGORY_ID, categoryName: "Dazn", channelName: `DAZN ${Number(daznNumber)}` }
  if (/\bufc\b.*\bfhd\b/.test(normalizedName)) return { categoryId: SYNEX_UFC_CATEGORY_ID, categoryName: "UFC", channelName: "UFC FHD" }
  if (/\bufc\b.*\bhd\b/.test(normalizedName)) return { categoryId: SYNEX_UFC_CATEGORY_ID, categoryName: "UFC", channelName: "UFC HD" }
  if (/\bufc\b.*\bsd\b/.test(normalizedName)) return { categoryId: SYNEX_UFC_CATEGORY_ID, categoryName: "UFC", channelName: "UFC SD" }
  if (geVariant) {
    const serviceName = geVariant[1] === "fast" ? "GE Fast" : "GE TV"
    return { categoryId: globoCategoryId, categoryName: "Globo", channelName: `${serviceName} ${geVariant[2].toUpperCase()}` }
  }

  return null
}

function shouldUseBlackLogo(...values: string[]) {
  const haystack = normalizeFilterText(values.join(" "))
  return BLACK_LOGO_TERMS.some((term) => haystack.includes(term))
}

declare global {
  interface Window {
    __onGCastApiAvailable?: (isAvailable: boolean) => void
    cast?: any
    chrome?: any
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const playerRef = useRef<HTMLDivElement>(null)
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const controlsVisibleRef = useRef(true)
  const lastMouseMoveRef = useRef(0)
  const playbackRecoveryTimerRef = useRef<NodeJS.Timeout | null>(null)
  const playerNoticeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const playbackRecoveryAttemptsRef = useRef(0)
  const lastPlaybackPositionRef = useRef(0)

  const [isLoading, setIsLoading] = useState(true)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [workingServer, setWorkingServer] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null)
  const [subscriberFullName, setSubscriberFullName] = useState("")
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [loadingChannel, setLoadingChannel] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [playerNotice, setPlayerNotice] = useState<string | null>(null)
  const [connectionAttempt, setConnectionAttempt] = useState(0)
  const [playerReloadKey, setPlayerReloadKey] = useState(0)
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const selectedStreamUrl = useMemo(() => {
    if (!selectedChannel || !workingServer || !username || !password) return null
    return buildStreamUrl(workingServer, username, password, selectedChannel.stream_id)
  }, [selectedChannel, workingServer, username, password])
  const userInfo = accountInfo?.user_info
  const accountDisplayName = subscriberFullName || userInfo?.username || username
  const accountStatus = formatAccountStatus(userInfo?.status)
  const planName = formatPlanName(userInfo)
  const expirationDate = formatAccountDate(userInfo?.exp_date)
  const createdDate = formatAccountDate(userInfo?.created_at)
  const activeConnections = Number(userInfo?.active_cons ?? 0)
  const maxConnections = Number(userInfo?.max_connections ?? 0)
  const connectionLabel = maxConnections > 0 ? `${activeConnections}/${maxConnections}` : `${activeConnections}`

  const stopPlayback = useCallback(() => {
    if (playbackRecoveryTimerRef.current) {
      clearTimeout(playbackRecoveryTimerRef.current)
      playbackRecoveryTimerRef.current = null
    }

    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.removeAttribute("src")
      videoRef.current.load()
    }

    setIsPlaying(false)
    setLoadingChannel(false)
  }, [])

  // Check credentials on mount
  useEffect(() => {
    const storedUsername = sessionStorage.getItem("iptv_username")
    const storedPassword = sessionStorage.getItem("iptv_password")

    if (!storedUsername || !storedPassword) {
      router.push("/login")
      return
    }

    setUsername(storedUsername)
    setPassword(storedPassword)
  }, [router])

  useEffect(() => {
    if (!username || !password) return

    let cancelled = false

    const loadSubscriberName = async () => {
      try {
        const response = await fetch("/api/assinante", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        })

        if (!response.ok) return

        const data = (await response.json()) as { fullName?: string | null }
        if (!cancelled) {
          setSubscriberFullName(data.fullName?.trim() ?? "")
        }
      } catch {
        if (!cancelled) {
          setSubscriberFullName("")
        }
      }
    }

    loadSubscriberName()

    return () => {
      cancelled = true
    }
  }, [username, password])

  useEffect(() => {
    if (!accountMenuOpen) return

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false)
      }
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAccountMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick)
    document.addEventListener("keydown", closeOnEscape)

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick)
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [accountMenuOpen])

  // Try to connect to servers and fetch data
  useEffect(() => {
    if (!username || !password) return

    let cancelled = false
    const controllers: AbortController[] = []
    const connectionTimeout = window.setTimeout(() => {
      if (cancelled) return
      controllers.forEach((controller) => controller.abort())
      setError("A conexão demorou demais. Verifique suas credenciais e tente novamente.")
      setIsLoading(false)
    }, 30000)

    const fetchWithTimeout = (url: string, timeoutMs: number) => {
      const controller = new AbortController()
      controllers.push(controller)

      const timeout = window.setTimeout(() => {
        controller.abort()
      }, timeoutMs)

      return fetch(`${url}&_=${Date.now()}`, {
        signal: controller.signal,
        cache: "no-store",
      }).finally(() => {
        window.clearTimeout(timeout)
      })
    }

    const tryServers = async () => {
      setIsLoading(true)
      setError(null)
      setWorkingServer(null)
      setAccountInfo(null)
      setCategories([])
      setChannels([])
      setSelectedCategory(null)
      setSelectedChannel(null)

      const loadServerData = async (server: string) => {
        const startedAt = performance.now()
        const response = await fetchWithTimeout(buildApiUrl(server, username, password, "get_live_categories"), 10000)

        if (!response.ok) return null

        const data = await response.json()
        if (!Array.isArray(data) || data.length === 0) return null

        const serverCategories = data as Category[]

        const [accountResult, channelsResult] = await Promise.allSettled([
          fetchWithTimeout(buildAccountApiUrl(server, username, password), 10000),
          fetchWithTimeout(buildApiUrl(server, username, password, "get_live_streams"), 15000),
        ])

        let serverAccountInfo: AccountInfo | null = null
        if (accountResult.status === "fulfilled" && accountResult.value.ok) {
          const accountData = await accountResult.value.json()
          if (accountData && typeof accountData === "object") {
            serverAccountInfo = accountData
          }
        }

        let serverChannels: Channel[] = []
        if (channelsResult.status === "fulfilled" && channelsResult.value.ok) {
          const channelsData = await channelsResult.value.json()
          serverChannels = Array.isArray(channelsData) ? channelsData : []
        }

        const categoryById = new Map(serverCategories.map((cat) => [cat.category_id, cat.category_name]))
        const sportsCategory = serverCategories.find((cat) => isSportsCategory(cat.category_name))
        const sportsCategoryId = sportsCategory?.category_id ?? SYNEX_SPORTS_CATEGORY_ID
        const hboMaxCategory = serverCategories.find((cat) => matchesTerms(["hbo", "hbo max"], cat.category_name))
        const hboMaxCategoryId = hboMaxCategory?.category_id ?? SYNEX_HBO_MAX_CATEGORY_ID
        const globoCategory = serverCategories.find((cat) => matchesTerms(["globo"], cat.category_name))
        const globoCategoryId = globoCategory?.category_id ?? SYNEX_GLOBO_CATEGORY_ID
        const ppvCategoryIds = new Set(
          serverCategories
            .filter((cat) => isPpvCategory(cat.category_name))
            .map((cat) => cat.category_id),
        )
        const allowedCategoryIds = new Set<string>()

        for (const category of serverCategories) {
          if (isMoviesSeriesCategory(category.category_name)) continue
          if (isHiddenCategory(category.category_name)) continue
          if (isPpvCategory(category.category_name)) continue
          if (isSyntheticRequestedCategory(category.category_name)) continue

          if (matchesChannelFilter(category.category_name)) {
            allowedCategoryIds.add(category.category_id)
          }
        }

        const filteredServerChannels = serverChannels.flatMap((channel) => {
          const categoryName = categoryById.get(channel.category_id) ?? ""
          if (isMoviesSeriesCategory(categoryName)) return []

          const isPpvChannel = ppvCategoryIds.has(channel.category_id) || isPpvCategory(channel.name, categoryName)
          const sportsMaxChannelNumber = getSportsMaxChannelNumber(channel.name)
          const isSportsMaxChannel = Boolean(sportsMaxChannelNumber)
          const requestedChannelMapping = getRequestedChannelMapping(channel.name, globoCategoryId)
          const normalizedChannel = requestedChannelMapping
            ? { ...channel, category_id: requestedChannelMapping.categoryId, name: requestedChannelMapping.channelName }
            : isSportsMaxChannel
            ? { ...channel, category_id: hboMaxCategoryId, name: formatHboMaxChannelName(sportsMaxChannelNumber as string) }
            : isPpvChannel
              ? { ...channel, category_id: sportsCategoryId }
              : channel
          const normalizedCategoryName = requestedChannelMapping?.categoryName ?? (isSportsMaxChannel ? "HBO Max" : isPpvChannel ? "Esportes" : categoryName)
          if (isHiddenCategory(normalizedCategoryName)) return []

          const isAllowed = matchesChannelFilter(normalizedChannel.name, normalizedCategoryName)

          if (isAllowed) {
            allowedCategoryIds.add(normalizedChannel.category_id)
          }

          return isAllowed ? [normalizedChannel] : []
        })

        const filteredCategories = serverCategories.filter((cat) => {
          if (isMoviesSeriesCategory(cat.category_name)) return false
          if (isHiddenCategory(cat.category_name)) return false
          if (isPpvCategory(cat.category_name)) return false
          if (isSyntheticRequestedCategory(cat.category_name)) return false
          return allowedCategoryIds.has(cat.category_id)
        })

        if (!hboMaxCategory && allowedCategoryIds.has(SYNEX_HBO_MAX_CATEGORY_ID)) {
          filteredCategories.push({
            category_id: SYNEX_HBO_MAX_CATEGORY_ID,
            category_name: "HBO Max",
            parent_id: 0,
          })
        }

        if (!globoCategory && allowedCategoryIds.has(SYNEX_GLOBO_CATEGORY_ID)) {
          filteredCategories.push({
            category_id: SYNEX_GLOBO_CATEGORY_ID,
            category_name: "Globo",
            parent_id: 0,
          })
        }

        const syntheticCategories: Category[] = [
          { category_id: SYNEX_CAZETV_CATEGORY_ID, category_name: "CazeTV", parent_id: 0 },
          { category_id: SYNEX_GOAT_CATEGORY_ID, category_name: "GOAT", parent_id: 0 },
          { category_id: SYNEX_UFC_CATEGORY_ID, category_name: "UFC", parent_id: 0 },
          { category_id: SYNEX_DAZN_CATEGORY_ID, category_name: "Dazn", parent_id: 0 },
        ]

        for (const category of syntheticCategories) {
          if (allowedCategoryIds.has(category.category_id)) {
            filteredCategories.push(category)
          }
        }

        if (filteredCategories.length === 0 || filteredServerChannels.length === 0) return null

        return {
          server,
          accountInfo: serverAccountInfo,
          categories: filteredCategories,
          channels: filteredServerChannels,
          latencyMs: performance.now() - startedAt,
        }
      }

      const serverResults = await Promise.all(
        IPTV_SERVERS.map(async (server) => {
          try {
            if (cancelled) return null
            return await loadServerData(server)
          } catch (err) {
            console.log(`Server ${server} failed, trying next...`)
            return null
          }
        }),
      )

      if (cancelled) return

      const bestServer = serverResults
        .filter((result): result is NonNullable<typeof result> => Boolean(result))
        .sort((a, b) => {
          const aHasChannels = a.channels.length > 0
          const bHasChannels = b.channels.length > 0

          if (aHasChannels !== bHasChannels) return bHasChannels ? 1 : -1
          return a.latencyMs - b.latencyMs
        })[0]

      if (!bestServer) {
        setError("Nenhum servidor disponivel. Verifique suas credenciais.")
        setIsLoading(false)
        window.clearTimeout(connectionTimeout)
        return
      }

      setWorkingServer(bestServer.server)
      setAccountInfo(bestServer.accountInfo)
      setCategories(bestServer.categories)
      setChannels(bestServer.channels)
      setIsLoading(false)
      window.clearTimeout(connectionTimeout)
    }

    tryServers()

    return () => {
      cancelled = true
      window.clearTimeout(connectionTimeout)
      controllers.forEach((controller) => controller.abort())
    }
  }, [username, password, connectionAttempt])

  const categoryNameById = useMemo(() => {
    return new Map(categories.map((cat) => [cat.category_id, formatCategoryName(cat.category_name)]))
  }, [categories])

  const filteredCategoryIds = useMemo(() => {
    return new Set(categories.map((cat) => cat.category_id))
  }, [categories])

  const categoryChannelCountById = useMemo(() => {
    const countById = new Map<string, number>()

    for (const channel of channels) {
      if (!filteredCategoryIds.has(channel.category_id)) continue
      countById.set(channel.category_id, (countById.get(channel.category_id) ?? 0) + 1)
    }

    return countById
  }, [channels, filteredCategoryIds])

  const filteredCategoryChannelCount = useMemo(() => {
    let count = 0

    for (const channel of channels) {
      if (filteredCategoryIds.has(channel.category_id)) {
        count += 1
      }
    }

    return count
  }, [channels, filteredCategoryIds])

  const filteredChannels = useMemo(() => {
    let filtered = channels.filter((ch) => filteredCategoryIds.has(ch.category_id))

    if (selectedCategory) {
      filtered = filtered.filter(ch => ch.category_id === selectedCategory.category_id)
    }

    if (deferredSearchQuery) {
      const query = deferredSearchQuery.toLowerCase()
      filtered = filtered.filter(ch => ch.name.toLowerCase().includes(query))
    }

    return filtered
  }, [channels, filteredCategoryIds, selectedCategory, deferredSearchQuery])

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    const now = Date.now()
    if (now - lastMouseMoveRef.current < 120) return
    lastMouseMoveRef.current = now

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    if (!controlsVisibleRef.current) {
      controlsVisibleRef.current = true
      setShowControls(true)
    }
    if (selectedChannel && isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        controlsVisibleRef.current = false
        setShowControls(false)
      }, 4500)
    }
  }, [selectedChannel, isPlaying])

  const showPlayerControls = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }

    if (!controlsVisibleRef.current) {
      controlsVisibleRef.current = true
      setShowControls(true)
    }

    if (selectedChannel && isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        controlsVisibleRef.current = false
        setShowControls(false)
      }, 4500)
    }
  }, [selectedChannel, isPlaying])

  useEffect(() => {
    showPlayerControls()
  }, [selectedChannel, isPlaying, showPlayerControls])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      if (playerNoticeTimeoutRef.current) {
        clearTimeout(playerNoticeTimeoutRef.current)
      }
    }
  }, [resetControlsTimeout])

  // Select channel
  const selectChannel = useCallback((channel: Channel) => {
    if (!workingServer) return
    setSelectedChannel(channel)
    setLoadingChannel(true)
    setError(null)
  }, [workingServer])

  const closePlayer = () => {
    stopPlayback()
    setSelectedChannel(null)
    setError(null)
  }

  // Effect to start playback when channel changes
  useEffect(() => {
    if (!selectedChannel || !workingServer || !videoRef.current) {
      return
    }

    const video = videoRef.current
    let disposed = false
    let nativeLoadHandler: (() => void) | null = null
    let nativeErrorHandler: (() => void) | null = null
    let watchPlaybackHealth: (() => void) | null = null

    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    if (playbackRecoveryTimerRef.current) {
      clearTimeout(playbackRecoveryTimerRef.current)
      playbackRecoveryTimerRef.current = null
    }

    playbackRecoveryAttemptsRef.current = 0
    lastPlaybackPositionRef.current = 0
    video.pause()
    video.removeAttribute('src')
    video.load()

    const streamUrl = selectedStreamUrl
    if (!streamUrl) return

    const tryPlay = async () => {
      try {
        await video.play()
        if (disposed) return
        setIsPlaying(true)
        setLoadingChannel(false)
      } catch (playError) {
        if (disposed) return
        console.log('[v0] Erro ao dar play:', playError)
        setIsPlaying(false)
        setLoadingChannel(false)
      }
    }

    const schedulePlaybackRecovery = () => {
      if (playbackRecoveryTimerRef.current) return

      lastPlaybackPositionRef.current = video.currentTime
      playbackRecoveryTimerRef.current = setTimeout(() => {
        playbackRecoveryTimerRef.current = null
        if (disposed || video.paused || video.ended || !selectedChannel) return

        const stalled = Math.abs(video.currentTime - lastPlaybackPositionRef.current) < 0.15
        if (!stalled) return

        playbackRecoveryAttemptsRef.current += 1
        setLoadingChannel(true)

        if (hlsRef.current) {
          if (playbackRecoveryAttemptsRef.current <= 2) {
            hlsRef.current.startLoad()
            void tryPlay()
            return
          }

          hlsRef.current.stopLoad()
          hlsRef.current.startLoad(-1)
          void tryPlay()
          return
        }

        if (video.src) {
          video.load()
          void tryPlay()
        }
      }, 7000)
    }

    const clearPlaybackRecovery = () => {
      if (playbackRecoveryTimerRef.current) {
        clearTimeout(playbackRecoveryTimerRef.current)
        playbackRecoveryTimerRef.current = null
      }
      if (!video.paused && !video.ended) {
        playbackRecoveryAttemptsRef.current = 0
        setLoadingChannel(false)
      }
    }

    watchPlaybackHealth = schedulePlaybackRecovery
    video.addEventListener("waiting", schedulePlaybackRecovery)
    video.addEventListener("stalled", schedulePlaybackRecovery)
    video.addEventListener("playing", clearPlaybackRecovery)
    video.addEventListener("timeupdate", clearPlaybackRecovery)

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        capLevelToPlayerSize: true,
        backBufferLength: 10,
        maxBufferLength: 18,
        maxMaxBufferLength: 30,
        manifestLoadingTimeOut: 10000,
        fragLoadingTimeOut: 12000,
        fragLoadingMaxRetry: 3,
        manifestLoadingMaxRetry: 2,
        startLevel: -1,
        debug: false,
      })

      hls.loadSource(streamUrl)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        tryPlay()
      })

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (disposed) return

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setLoadingChannel(true)
              hls.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              setLoadingChannel(true)
              hls.recoverMediaError()
              break
            default:
              setError("Erro ao carregar o canal.")
              setLoadingChannel(false)
              hls.destroy()
              break
          }
          return
        }

        if (data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
          schedulePlaybackRecovery()
        }
      })

      hlsRef.current = hls
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl
      
      nativeLoadHandler = () => {
        tryPlay()
      }
      
      nativeErrorHandler = () => {
        if (disposed) return
        setError("Erro ao carregar o canal.")
        setLoadingChannel(false)
      }

      video.addEventListener("loadedmetadata", nativeLoadHandler)
      video.addEventListener("error", nativeErrorHandler)
    } else {
      setError("Seu navegador não suporta reprodução HLS.")
      setLoadingChannel(false)
    }

    return () => {
      disposed = true
      if (watchPlaybackHealth) {
        video.removeEventListener("waiting", watchPlaybackHealth)
        video.removeEventListener("stalled", watchPlaybackHealth)
      }
      video.removeEventListener("playing", clearPlaybackRecovery)
      video.removeEventListener("timeupdate", clearPlaybackRecovery)
      if (nativeLoadHandler) video.removeEventListener("loadedmetadata", nativeLoadHandler)
      if (nativeErrorHandler) video.removeEventListener("error", nativeErrorHandler)
      if (playbackRecoveryTimerRef.current) {
        clearTimeout(playbackRecoveryTimerRef.current)
        playbackRecoveryTimerRef.current = null
      }
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [selectedChannel, workingServer, username, password, selectedStreamUrl, playerReloadKey])

  // Video controls
  const reloadCurrentChannel = useCallback(() => {
    if (!selectedChannel) return
    setError(null)
    setLoadingChannel(true)
    setPlayerReloadKey((key) => key + 1)
  }, [selectedChannel])

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
  }

  const toggleFullscreen = async () => {
    const fullscreenDocument = document as FullscreenDocument
    const fullscreenElement =
      document.fullscreenElement ||
      fullscreenDocument.webkitFullscreenElement ||
      fullscreenDocument.msFullscreenElement

    if (fullscreenElement) {
      await (document.exitFullscreen?.() ??
        fullscreenDocument.webkitExitFullscreen?.() ??
        fullscreenDocument.msExitFullscreen?.())
      return
    }

    const video = videoRef.current as MobileFullscreenVideo | null
    if (video?.webkitEnterFullscreen) {
      video.webkitEnterFullscreen()
      return
    }

    const player = playerRef.current as FullscreenContainer | null
    if (!player) return

    try {
      await (player.requestFullscreen?.() ??
        player.webkitRequestFullscreen?.() ??
        player.msRequestFullscreen?.())
    } catch {
      showPlayerNotice("Tela cheia indisponivel neste navegador.")
    }
  }

  const showPlayerNotice = useCallback((message: string) => {
    if (playerNoticeTimeoutRef.current) {
      clearTimeout(playerNoticeTimeoutRef.current)
    }

    setPlayerNotice(message)
    playerNoticeTimeoutRef.current = setTimeout(() => {
      setPlayerNotice(null)
      playerNoticeTimeoutRef.current = null
    }, 3500)
  }, [])

  const loadCastSdk = () => {
    return new Promise<boolean>((resolve) => {
      if (window.cast?.framework && window.chrome?.cast) {
        resolve(true)
        return
      }

      const existingScript = document.querySelector<HTMLScriptElement>('script[data-synex-cast="true"]')
      const timeout = window.setTimeout(() => resolve(false), 7000)

      window.__onGCastApiAvailable = (isAvailable: boolean) => {
        window.clearTimeout(timeout)
        resolve(isAvailable)
      }

      if (existingScript) return

      const script = document.createElement("script")
      script.src = "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"
      script.async = true
      script.dataset.synexCast = "true"
      script.onerror = () => {
        window.clearTimeout(timeout)
        resolve(false)
      }
      document.head.appendChild(script)
    })
  }

  const startCasting = async () => {
    if (!selectedChannel || !selectedStreamUrl) {
      showPlayerNotice("Selecione um canal antes de transmitir.")
      return
    }

    const castReady = await loadCastSdk()
    if (castReady && window.cast?.framework && window.chrome?.cast) {
      try {
        const castContext = window.cast.framework.CastContext.getInstance()
        castContext.setOptions({
          receiverApplicationId: window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
          autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
        })

        const session = await castContext.requestSession()
        const mediaInfo = new window.chrome.cast.media.MediaInfo(selectedStreamUrl, "application/x-mpegURL")
        mediaInfo.metadata = new window.chrome.cast.media.GenericMediaMetadata()
        mediaInfo.metadata.title = selectedChannel.name

        const request = new window.chrome.cast.media.LoadRequest(mediaInfo)
        await session.loadMedia(request)
        showPlayerNotice("Transmitindo para o dispositivo selecionado.")
        return
      } catch (err) {
        const castError = err instanceof Error ? err.message : String(err)
        if (!castError.toLowerCase().includes("cancel")) {
          showPlayerNotice("Não foi possível iniciar a transmissão.")
        }
        return
      }
    }

    const video = videoRef.current as RemotePlaybackVideo | null

    if (!video?.remote?.prompt) {
      showPlayerNotice("Transmissão para dispositivos próximos não está disponível neste navegador.")
      return
    }

    try {
      await video.remote.prompt()
    } catch (err) {
      const castError = err instanceof DOMException ? err.name : ""
      if (castError !== "AbortError" && castError !== "NotAllowedError") {
        showPlayerNotice("Não foi possível iniciar a transmissão.")
      }
    }
  }

  const handleLogout = () => {
    stopPlayback()
    sessionStorage.removeItem("iptv_username")
    sessionStorage.removeItem("iptv_password")
    setAccountMenuOpen(false)
    router.replace("/")
  }

  const retryConnection = () => {
    setIsLoading(true)
    setError(null)
    setWorkingServer(null)
    setAccountInfo(null)
    setCategories([])
    setChannels([])
    setSelectedCategory(null)
    setSelectedChannel(null)
    setConnectionAttempt((attempt) => attempt + 1)
  }

  function formatAccountStatus(status?: string) {
    if (!status) return "Conectado"
    if (status.toLowerCase() === "active") return "Ativo"
    if (status.toLowerCase() === "disabled") return "Desativado"
    if (status.toLowerCase() === "banned") return "Bloqueado"
    if (status.toLowerCase() === "expired") return "Expirado"
    return status
  }

  function formatPlanName(userInfo: AccountInfo["user_info"]) {
    if (userInfo?.is_trial === "1" || userInfo?.is_trial === 1) return "Gratuito"

    const rawPlan = [
      userInfo?.plan_name,
      userInfo?.package_name,
      userInfo?.plan,
      userInfo?.package,
      userInfo?.subscription,
    ].find((value) => value?.trim())

    const normalizedPlan = rawPlan?.toLowerCase() ?? ""
    if (normalizedPlan.includes("tri") || normalizedPlan.includes("3")) return "Trimensal"
    if (normalizedPlan.includes("anu") || normalizedPlan.includes("year") || normalizedPlan.includes("12")) return "Anual"
    if (normalizedPlan.includes("mens") || normalizedPlan.includes("month") || normalizedPlan.includes("30")) return "Mensal"

    const createdAt = Number(userInfo?.created_at)
    const expiresAt = Number(userInfo?.exp_date)
    if (Number.isFinite(createdAt) && Number.isFinite(expiresAt) && createdAt > 0 && expiresAt > createdAt) {
      const days = (expiresAt - createdAt) / 86400
      if (days <= 45) return "Mensal"
      if (days <= 120) return "Trimensal"
      if (days >= 300) return "Anual"
    }

    return "Mensal"
  }

  function formatAccountDate(value?: string | number) {
    if (!value) return "Nao informado"

    const timestamp = Number(value)
    if (!Number.isFinite(timestamp) || timestamp <= 0) return "Nao informado"

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(timestamp * 1000))
  }

  function formatCategoryName(name: string) {
    let formatted = name
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "")
      .replace(/^\s*CANAIS\s*\|\s*/i, "")
      .replace(/^[^\p{L}\p{N}]+/gu, "")
      .replace(/[^\p{L}\p{N}\s]+$/gu, "")
      .replace(/\s{2,}/g, " ")
      .trim()
      .toLowerCase()
    if (formatted.includes("sbt")) return "SBT"
    if (formatted.includes("cazetv") || formatted.includes("caze tv")) return "CazeTV"
    if (formatted.includes("goat")) return "GOAT"
    if (formatted.includes("ufc")) return "UFC"
    if (formatted.includes("dazn")) return "Dazn"
    if (formatted.includes("amazon")) return "Amazon Prime"
    if (formatted.includes("hbo")) return "HBO Max"
    if (formatted.includes("espn")) return "ESPN"
    if (formatted.includes("premiere")) return "Premiere"
    if (formatted.includes("sportv")) return "SporTV"
    if (formatted.includes("globo")) return "Globo"
    if (!formatted) return "Categoria"
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }

  function formatChannelName(name: string) {
    return name
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "")
      .replace(/^\s*\d+\s*\|\s*/u, "")
      .replace(/^[^\p{L}\p{N}]+/gu, "")
      .replace(/[^\p{L}\p{N}\s]+$/gu, "")
      .replace(/\s{2,}/g, " ")
      .trim()
  }

  function getChannelLogoSrc(channel: Channel, formattedName: string) {
    const categoryName = categoryNameById.get(channel.category_id) ?? ""
    const haystack = `${channel.name} ${formattedName} ${categoryName}`.toLowerCase()

    if (haystack.includes("hbo")) return "https://i.ibb.co/twR0Q0hd/hbo.png"
    if (haystack.includes("globo")) return "https://i.ibb.co/Gv4k5Gcr/globo.png"
    if (haystack.includes("sbt")) return "https://i.ibb.co/1J8nYkpT/sbt.png"
    if (haystack.includes("espn")) return "https://i.ibb.co/m5WK8KRQ/espn.png"
    if (haystack.includes("premiere")) return "https://i.ibb.co/xt7TP3Lx/premiere.png"
    if (haystack.includes("sportv")) return "https://i.ibb.co/RpNxzrr5/sportv.png"
    if (haystack.includes("amazon") || haystack.includes("prime")) return "https://i.ibb.co/svCH18T2/prime.png"

    return ""
  }

  function getChannelImageClass(channel: Channel, formattedName: string, fallbackClass: string) {
    const categoryName = categoryNameById.get(channel.category_id) ?? ""

    if (shouldUseBlackLogo(channel.name, formattedName, categoryName)) {
      return cn(fallbackClass, "brightness-0")
    }

    return fallbackClass
  }

  function getChannelLogoClass(logoSrc: string) {
    if (logoSrc.includes("esporte")) {
      return "p-2"
    }

    if (logoSrc.includes("sportv") || logoSrc.includes("prime")) {
      return "p-4"
    }

    return "p-8"
  }

  function getStreamIconSrc(streamIcon?: string) {
    if (!streamIcon) return ""

    if (streamIcon.startsWith("http://") || streamIcon.startsWith("https://")) {
      return `/api/channel-image?url=${encodeURIComponent(streamIcon)}`
    }

    return streamIcon
  }

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-muted via-background/70 to-muted/80 pointer-events-none" />
        <div className="gradient-glow gradient-glow-1 opacity-80" style={{ top: '-180px', left: '-120px' }} />
        <div className="gradient-glow gradient-glow-2 opacity-80" style={{ top: '220px', right: '-160px' }} />
        <div className="gradient-glow gradient-glow-3 opacity-70" style={{ bottom: '-220px', left: '20%' }} />
        <div className="relative z-10">
          <div className="w-16 h-16 border-2 border-muted rounded-full" />
          <div className="absolute inset-0 w-16 h-16 border-2 border-transparent border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  // Error screen
  if (error && !workingServer) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-muted via-background/70 to-muted/80 pointer-events-none" />
        <div className="gradient-glow gradient-glow-1 opacity-70" style={{ top: '-180px', left: '-120px' }} />
        <div className="gradient-glow gradient-glow-2 opacity-70" style={{ top: '220px', right: '-160px' }} />
        <div className="gradient-glow gradient-glow-3 opacity-60" style={{ bottom: '-220px', left: '20%' }} />

        <FadeIn
          direction="up"
          duration={500}
          className="relative z-10 w-full max-w-md"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-foreground/20 bg-foreground shadow-lg shadow-foreground/10">
              <X className="h-9 w-9 text-background" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Não foi possível entrar
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">{error}</p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={retryConnection}
              className="h-12 flex-1 gap-2 rounded-full bg-foreground px-6 text-background shadow-lg shadow-foreground/10 transition-all hover:scale-[1.02] hover:bg-foreground/90 hover:shadow-xl"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="h-12 flex-1 gap-2 rounded-full border-border bg-background/80 px-6 backdrop-blur-sm transition-all hover:scale-[1.02] hover:bg-muted"
            >
              <LogOut className="w-4 h-4" />
              Alterar dados
            </Button>
          </div>
        </FadeIn>
      </div>
    )
  }

  return (
    <div className="relative h-screen overflow-hidden bg-[linear-gradient(115deg,oklch(0.93_0_0)_0%,oklch(0.98_0_0)_42%,oklch(0.92_0_0)_100%)] text-foreground">
      <div className="absolute inset-0 bg-[linear-gradient(115deg,oklch(0.93_0_0)_0%,oklch(0.98_0_0)_42%,oklch(0.92_0_0)_100%)] pointer-events-none" />
      <div className="gradient-glow gradient-glow-1" style={{ top: '-220px', left: '-180px' }} />
      <div className="gradient-glow gradient-glow-2" style={{ top: '160px', right: '-220px' }} />
      <div className="gradient-glow gradient-glow-3" style={{ bottom: '-260px', left: '25%' }} />

      <header className={cn(
        "fixed left-0 right-0 top-0 z-50 h-16 transition-colors duration-300",
        panelOpen ? "bg-[linear-gradient(115deg,oklch(0.93_0_0)_0%,oklch(0.98_0_0)_58%,oklch(0.92_0_0)_100%)] lg:bg-transparent" : "bg-transparent"
      )}>
        <div className="flex h-full items-center gap-3 px-4 lg:px-6">
          <div ref={accountMenuRef} className="relative">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("rounded-xl hover:bg-secondary", accountMenuOpen && "bg-secondary")}
              aria-label="Abrir dados da conta"
              aria-expanded={accountMenuOpen}
              onClick={() => setAccountMenuOpen((open) => !open)}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
            </Button>

            {accountMenuOpen && (
              <div
                className="absolute left-0 top-14 z-[60] w-[min(20rem,calc(100vw-2rem))] origin-top-left overflow-hidden rounded-2xl border border-border/60 bg-background/95 shadow-2xl shadow-foreground/15 backdrop-blur-xl"
                style={{ animation: "synex-fade-in-down 180ms ease-out both" }}
              >
                <div className="border-b border-border/60 bg-[linear-gradient(135deg,oklch(0.98_0_0),oklch(0.93_0_0))] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {accountDisplayName}
                      </p>
                      {subscriberFullName && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{userInfo?.username ?? username}</p>
                      )}
                      <p className="mt-1 text-xs font-medium text-primary">{accountStatus}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 p-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-secondary/55 p-3">
                      <p className="text-[11px] font-medium text-muted-foreground">Plano</p>
                      <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{planName}</p>
                    </div>
                    <div className="rounded-xl bg-secondary/55 p-3">
                      <p className="text-[11px] font-medium text-muted-foreground">Sessões</p>
                      <p className="mt-0.5 text-sm font-semibold text-foreground">{connectionLabel}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-card/70 p-3">
                    <p className="text-xs font-medium text-muted-foreground">Validade</p>
                    <p className="mt-1 text-sm font-semibold text-card-foreground">{expirationDate}</p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full rounded-xl border-border/70 bg-background hover:bg-black hover:text-white"
                    onClick={handleLogout}
                  >
                    Sair
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center">
            <Button variant="ghost" size="icon" className="rounded-xl lg:hidden" onClick={() => setPanelOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      <div className="pointer-events-none fixed left-0 right-0 top-16 z-50 h-px bg-border" />

      {panelOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setPanelOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed bottom-0 left-0 top-16 z-40 w-64 border-r border-sidebar-border/40 bg-[linear-gradient(115deg,oklch(0.93_0_0)_0%,oklch(0.98_0_0)_58%,oklch(0.92_0_0)_100%)] transition-transform duration-300 ease-out lg:translate-x-0 lg:bg-transparent",
          panelOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col p-4">
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <span className="text-sm font-medium text-muted-foreground">Menu</span>
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setPanelOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <nav className="flex min-h-0 flex-1 flex-col">
            <div className="px-3 pb-1 pt-1">
              <p className="text-[11px] font-semibold uppercase text-muted-foreground/70">
                Categorias
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedCategory(null)
                setPanelOpen(false)
              }}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
                !selectedCategory
                  ? "bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.94_0_0)_58%,oklch(0.90_0_0)_100%)] text-sidebar-accent-foreground shadow-md shadow-foreground/5"
                  : "text-sidebar-foreground/70 hover:bg-white/35 hover:text-sidebar-foreground hover:shadow-sm"
              )}
            >
              <span className="truncate">Todos os Canais</span>
              <span className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                !selectedCategory ? "bg-foreground/10 text-foreground" : "bg-foreground/5 text-muted-foreground"
              )}>
                {filteredCategoryChannelCount}
              </span>
            </button>

            <div className="px-3 py-2">
              <div className="h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1">
              {categories.map((cat) => {
                const isActive = selectedCategory?.category_id === cat.category_id

                return (
                  <button
                    key={cat.category_id}
                    onClick={() => {
                      setSelectedCategory(cat)
                      setPanelOpen(false)
                    }}
                    className={cn(
                      "group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.94_0_0)_58%,oklch(0.90_0_0)_100%)] text-sidebar-accent-foreground shadow-md shadow-foreground/5"
                        : "text-sidebar-foreground/70 hover:bg-white/35 hover:text-sidebar-foreground hover:shadow-sm"
                    )}
                  >
                    <span className="truncate">{formatCategoryName(cat.category_name)}</span>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      isActive ? "bg-foreground/10 text-foreground" : "bg-foreground/5 text-muted-foreground"
                    )}>
                      {categoryChannelCountById.get(cat.category_id) ?? 0}
                    </span>
                  </button>
                )
              })}
            </div>
          </nav>

        </div>
      </aside>

      <main className="fixed bottom-0 left-0 right-0 top-16 z-10 overflow-y-auto overflow-x-hidden transition-all duration-300 lg:left-64">
        <div className={cn(
          "mx-auto flex max-w-7xl flex-col p-4 lg:p-6",
          selectedChannel ? "min-h-full" : "h-full overflow-hidden"
        )}>
          {selectedChannel && (
            <section className="mx-auto mb-8 w-full max-w-4xl">
              <div
                ref={playerRef}
                className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-[oklch(0.08_0.01_240)] shadow-[0_28px_80px_rgba(0,0,0,0.28)]"
                onMouseMove={resetControlsTimeout}
                onMouseEnter={showPlayerControls}
                onTouchStart={showPlayerControls}
              >
              <video
                ref={videoRef}
                className="block h-full w-full bg-black object-cover outline-none"
                playsInline
                controls={false}
                crossOrigin="anonymous"
                disableRemotePlayback={false}
                onClick={selectedChannel ? togglePlay : undefined}
                onPlay={() => {
                  setIsPlaying(true)
                  showPlayerControls()
                }}
                onPause={() => {
                  setIsPlaying(false)
                  showPlayerControls()
                }}
              />

              {loadingChannel && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full border-2 border-white/20" />
                      <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-2 border-transparent border-t-white" />
                    </div>
                  </div>
                </div>
              )}

              {error && selectedChannel && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 p-6 text-center backdrop-blur-sm">
                  <AlertCircle className="h-10 w-10 text-white" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Stream indisponivel</h3>
                    <p className="mt-1 text-sm text-white/60">{error}</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2 rounded-full border-white/20 bg-white text-black hover:bg-white/90" onClick={(e) => { e.stopPropagation(); reloadCurrentChannel() }}>
                    <RefreshCw className="h-4 w-4" />
                    Tentar novamente
                  </Button>
                </div>
              )}

              {selectedChannel && !loadingChannel && !error && !isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
                    <Play className="ml-1 h-10 w-10 text-white" />
                  </div>
                </div>
              )}

              {playerNotice && (
                <div className="absolute left-1/2 top-6 z-30 max-w-[90%] -translate-x-1/2 rounded-full border border-white/10 bg-black/75 px-4 py-2 text-center text-xs text-white/80 shadow-lg">
                  {playerNotice}
                </div>
              )}

              {selectedChannel && (
                <div className={cn("absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-16 transition-opacity duration-300", showControls ? "opacity-100" : "pointer-events-none opacity-0")}>
                  <div className="mb-4 h-1 overflow-hidden rounded-full bg-white/20">
                    <div className="h-full w-[56%] animate-pulse rounded-full bg-white" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20" onClick={togglePlay}>
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
                      </Button>
                      <div className="group/volume flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20" onClick={toggleMute}>
                          {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                        </Button>
                        <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="h-1 w-0 cursor-pointer appearance-none rounded-full bg-white/20 accent-white opacity-0 transition-all duration-300 group-hover/volume:w-24 group-hover/volume:opacity-100" />
                      </div>
                      <Button variant="ghost" size="icon" className="hidden h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20 sm:inline-flex" onClick={() => startCasting()}>
                        <Cast className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20" onClick={reloadCurrentChannel}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="hidden h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20 sm:inline-flex">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20" onClick={toggleFullscreen}>
                        {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20" onClick={closePlayer}>
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              </div>
            </section>
          )}

          <section className={cn(
            "flex flex-col overflow-hidden",
            selectedChannel ? "min-h-[calc(100vh-8rem)]" : "min-h-0 flex-1"
          )}>
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <h2 className="truncate text-xl font-semibold text-foreground">
                  {selectedCategory ? formatCategoryName(selectedCategory.category_name) : "Todos os Canais"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {filteredChannels.length} {filteredChannels.length === 1 ? "canal disponivel" : "canais disponiveis"}
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:items-center">
                <div className="group relative w-full sm:min-w-80 lg:w-96">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar canais..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 w-full rounded-xl border-transparent bg-secondary/50 pl-10 pr-4 text-sm transition-all duration-200 placeholder:text-muted-foreground/70 focus:bg-card focus-visible:ring-2 focus-visible:ring-ring/10"
                  />
                </div>
              </div>
            </div>

            <FadeIn
              key={selectedCategory?.category_id ?? "all-channels"}
              direction="up"
              duration={420}
              className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
            >
              {filteredChannels.length === 0 ? (
                <div className="flex min-h-64 items-center justify-center p-8 text-center">
                  <div>
                    <Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                    <h3 className="font-semibold text-card-foreground">Nenhum canal encontrado</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Tente buscar por outro nome ou categoria.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 pb-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredChannels.map((channel) => {
                    const isActive = selectedChannel?.stream_id === channel.stream_id
                    const channelName = formatChannelName(channel.name)
                    const logoSrc = getChannelLogoSrc(channel, channelName)
                    const streamIconSrc = getStreamIconSrc(channel.stream_icon)
                    const logoClass = logoSrc ? getChannelImageClass(channel, channelName, getChannelLogoClass(logoSrc)) : ""
                    const streamIconClass = getChannelImageClass(channel, channelName, "p-8")

                    return (
                      <article key={channel.stream_id} className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border/50 bg-[oklch(0.90_0_0)] shadow-lg shadow-foreground/5 transition-all duration-300 hover:scale-[1.02] hover:border-border hover:shadow-xl hover:shadow-foreground/10" onClick={() => selectChannel(channel)}>
                        <div className="relative aspect-video overflow-hidden bg-[linear-gradient(180deg,oklch(0.98_0_0)_0%,oklch(0.95_0_0)_58%,oklch(0.92_0_0)_100%)]">
                          {logoSrc ? (
                            <div className="flex h-full w-full items-center justify-center bg-transparent transition-transform duration-500 group-hover:scale-110">
                              <img src={logoSrc} alt={channelName} className={cn("h-full w-full object-contain", logoClass)} />
                            </div>
                          ) : streamIconSrc ? (
                            <img src={streamIconSrc} alt={channelName} className={cn("h-full w-full object-contain transition-transform duration-500 group-hover:scale-110", streamIconClass)} />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,oklch(0.18_0.02_240),oklch(0.08_0.01_240))]">
                              <span className="text-5xl font-bold text-white/75">{channelName.slice(0, 1) || "S"}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            <div className="flex h-14 w-14 scale-90 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform duration-300 group-hover:scale-100">
                              <Play className="ml-1 h-6 w-6 text-foreground" />
                            </div>
                          </div>
                        </div>

                        <div className="bg-[oklch(0.90_0_0)] p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h3 className={cn("truncate font-semibold text-card-foreground transition-colors", isActive && "text-primary")}>{channelName}</h3>
                              <p className="mt-1 truncate text-xs text-muted-foreground">{categoryNameById.get(channel.category_id) ?? "TV ao vivo"}</p>
                            </div>
                            {isActive && (
                              <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-2 py-1">
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                                </span>
                                <span className="text-[10px] font-medium uppercase text-primary">Assistindo</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </FadeIn>

          </section>
        </div>
      </main>
    </div>
  )
}
