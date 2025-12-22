/**
 * React Query hooks for Islands
 */
import { useQuery } from "@tanstack/react-query"
import { islandsApi } from "../lib/api"

/**
 * Hook to get details for a specific island including stories
 * @param {string} islandId - The ID or slug of the island
 * @returns {object} TanStack Query query object
 */
export function useIsland(islandId) {
  return useQuery({
    queryKey: ["island", islandId],
    queryFn: () => islandsApi.getIsland(islandId),
    enabled: !!islandId,
    staleTime: 1000 * 60 * 30, // 30 minutes (island content is static)
  })
}
