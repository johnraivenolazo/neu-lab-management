import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { LabLog } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDurationSeconds(log: Pick<LabLog, "checkIn" | "checkOut" | "duration" | "durationSeconds">): number | null {
  if (!log.checkOut) return null

  const fromTimestamps = Math.max(0, Math.round((log.checkOut.getTime() - log.checkIn.getTime()) / 1000))
  if (fromTimestamps > 0) return fromTimestamps

  if (log.durationSeconds !== null && log.durationSeconds !== undefined) {
    return Math.max(0, Math.round(log.durationSeconds))
  }

  if (log.duration !== null && log.duration !== undefined) {
    return Math.max(0, Math.round(log.duration * 60))
  }

  return 0
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`
  }

  return `${minutes}m ${remainingSeconds}s`
}

export function formatLogDuration(log: Pick<LabLog, "checkIn" | "checkOut" | "duration" | "durationSeconds">): string {
  const seconds = getDurationSeconds(log)
  if (seconds === null) return "--"
  return formatDuration(seconds)
}
