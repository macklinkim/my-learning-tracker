import { hc } from 'hono/client'
import type { AppType } from '@learning-tracker/backend'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787'

export const apiClient = hc<AppType>(API_URL)
