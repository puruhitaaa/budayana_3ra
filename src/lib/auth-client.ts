import { createAuthClient } from "better-auth/react"
import { usernameClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: "https://budayana-dusky.vercel.app/auth/api",
  plugins: [usernameClient()],
})
