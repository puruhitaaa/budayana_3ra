/**
 * React Query hooks for user progress management
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { progressApi } from "../lib/api"
import { authClient } from "../lib/auth-client"

/**
 * Hook to get current session/user from better-auth
 * @returns {object} { user, session, isLoading }
 */
export function useSession() {
  return authClient.useSession()
}

/**
 * Hook to initialize user progress after signup
 * @returns {object} TanStack Query mutation object
 */
export function useInitializeProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => progressApi.initialize(),
    onSuccess: () => {
      // Invalidate progress cache after initialization
      queryClient.invalidateQueries({ queryKey: ["progress"] })
      queryClient.invalidateQueries({ queryKey: ["myProgress"] })
    },
  })
}

/**
 * Hook to get current user's progress for all islands
 * @param {object} params - Optional query parameters
 * @returns {object} TanStack Query query object
 */
export function useMyProgress(params = {}) {
  const { data: session } = authClient.useSession()

  return useQuery({
    queryKey: ["myProgress", session?.user?.id, params],
    queryFn: () => progressApi.getMyProgress(params),
    enabled: !!session?.user?.id, // Only fetch when user is authenticated
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to get progress for a specific island
 * @param {string} islandId
 * @returns {object} TanStack Query query object
 */
export function useIslandProgress(islandId) {
  const { data: session } = authClient.useSession()

  return useQuery({
    queryKey: ["islandProgress", islandId, session?.user?.id],
    queryFn: () => progressApi.getIslandProgress(islandId),
    enabled: !!session?.user?.id && !!islandId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to get cycle count for a specific island
 * @param {string} islandId
 * @returns {object} TanStack Query query object
 */
export function useIslandCycles(islandId) {
  const { data: session } = authClient.useSession()

  return useQuery({
    queryKey: ["islandCycles", islandId, session?.user?.id],
    queryFn: () => progressApi.getIslandCycles(islandId),
    enabled: !!session?.user?.id && !!islandId,
  })
}
