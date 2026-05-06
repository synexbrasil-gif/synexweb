export const IPTV_SERVERS = [
  "p2mult.xyz",
]

export interface IPTVCredentials {
  username: string
  password: string
}

export interface Category {
  category_id: string
  category_name: string
  parent_id: number
}

export interface Channel {
  num: number
  name: string
  stream_type: string
  stream_id: number
  stream_icon: string
  epg_channel_id: string
  added: string
  category_id: string
  custom_sid: string
  tv_archive: number
  direct_source: string
  tv_archive_duration: number
}


export function buildApiUrl(server: string, username: string, password: string, action: string): string {
  const apiUrl = `http://${server}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=${action}`
  return `https://proxy.synexbr.com/proxy?url=${encodeURIComponent(apiUrl)}`
}

export function buildAccountApiUrl(server: string, username: string, password: string): string {
  const apiUrl = `http://${server}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
  return `https://proxy.synexbr.com/proxy?url=${encodeURIComponent(apiUrl)}`
}

export function buildStreamUrl(server: string, username: string, password: string, streamId: number): string {
  const streamUrl = `http://${server}/live/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${streamId}.m3u8`
  return `https://proxy.synexbr.com/proxy?url=${encodeURIComponent(streamUrl)}`
}
