import { createAuthClient } from "better-auth/react"
export const authClient = createAuthClient({
  baseURL: "https://budayana-dusky.vercel.app/auth/api",
})
