import { useQuery } from "@tanstack/react-query"
import { attemptsApi, statisticsApi } from "../lib/api"

/**
 * Hook to fetch user results data including statistics and attempt history
 */
export function useResults() {
  // Fetch Statistics
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ["statistics"],
    queryFn: statisticsApi.get,
  })

  // Fetch Attempts History
  const {
    data: attemptsData,
    isLoading: attemptsLoading,
    error: attemptsError,
  } = useQuery({
    queryKey: ["attempts-history"],
    queryFn: () =>
      attemptsApi.list({
        limit: 50, // Fetch more for scrolling
        sortOrder: "desc", // Latest first makes more sense for history
        sortBy: "startedAt",
        isFinished: true,
      }),
  })

  // Normalize attempts data to always be an array
  const attempts = Array.isArray(attemptsData)
    ? attemptsData
    : attemptsData?.items || []

  return {
    stats,
    attempts,
    isLoading: statsLoading || attemptsLoading,
    isError: !!statsError || !!attemptsError,
    errors: {
      stats: statsError,
      attempts: attemptsError,
    },
  }
}
