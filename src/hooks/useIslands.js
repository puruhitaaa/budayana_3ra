/**
 * React Query hooks for Islands
 */
import { useQuery } from "@tanstack/react-query"
import { islandsApi } from "../lib/api"

/**
 * Hook to get details for a specific island including stories
 * @param {string} islandSlug - The slug of the island
 * @returns {object} TanStack Query query object
 */
export function useIsland(islandSlug) {
  return useQuery({
    queryKey: ["island", islandSlug],
    queryFn: () => islandsApi.getIsland(islandSlug),
    enabled: !!islandSlug,
    staleTime: 1000 * 60 * 30, // 30 minutes (island content is static)
  })
}
