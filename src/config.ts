/**
 * Centralized Application Configuration
 * Reads dynamically from environment variables (.env via Vite import.meta.env)
 */

export const BACKEND_URL: string = (
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8080'
).replace(/\/$/, '')

export const API_BASE_URL: string = (
  import.meta.env.VITE_API_BASE_URL ||
  `${BACKEND_URL}/api`
).replace(/\/$/, '')
