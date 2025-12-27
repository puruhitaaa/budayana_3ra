import React from "react"
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

  // Derive statistics client-side to ensure accuracy as per user request
  const derivedStats = React.useMemo(() => {
    const finishedAttempts = attempts.filter((a) => a.finishedAt)

    // 1. Stories Completed (Unique Story IDs)
    const uniqueStories = new Set(finishedAttempts.map((a) => a.storyId || a.story?.id))
    const storiesCompleted = uniqueStories.size

    // 2. Total XP (Sum of all XP gained)
    // 2. Total XP (Sum of all XP gained)
    const totalXp = finishedAttempts.reduce((sum, a) => {
      let xp = a.totalXpGained || 0

      // If XP is 0, try summing from stages (for Games where totalXpGained might be missing in older records)
      if (xp === 0 && a.stages && a.stages.length > 0) {
        xp = a.stages.reduce((s, st) => s + (st.xpGained || 0), 0)
      }

      // Fallback if XP is 0 but it's a finished story (usually 100xp default)
      // Check for STATIC type OR generic non-test if type is missing
      const isStatic = a.story?.storyType === "STATIC" || (!a.story?.storyType && !a.story?.title?.toLowerCase().includes("test"))

      if (xp === 0 && isStatic) {
        xp = 100
      }

      // Explicitly exclude XP from Tests (Pre/Post) per user request
      if (a.story?.title?.toLowerCase().includes("test")) {
        xp = 0
      }

      return sum + xp
    }, 0)

    // 3. Pre-Test Average
    const preTests = finishedAttempts.filter(
      (a) => (a.story?.title || "").toLowerCase().includes("pre-test") && a.preTestScore !== null
    )
    let averagePreTestScore = 0
    if (preTests.length > 0) {
      const totalScore = preTests.reduce((sum, a) => sum + (a.preTestScore || 0), 0)
      const maxPossible = preTests.length * 100
      averagePreTestScore = (totalScore / maxPossible) * 100
    }

    // 4. Post-Test Average
    const postTests = finishedAttempts.filter(
      (a) => (a.story?.title || "").toLowerCase().includes("post-test") && a.postTestScore !== null
    )
    let averagePostTestScore = 0
    if (postTests.length > 0) {
      const totalScore = postTests.reduce((sum, a) => sum + (a.postTestScore || 0), 0)
      const maxPossible = postTests.length * 100
      averagePostTestScore = (totalScore / maxPossible) * 100
    }

    return {
      storiesCompleted,
      totalXp,
      averagePreTestScore,
      averagePostTestScore,
    }
  }, [attempts])

  return {
    stats: derivedStats, // Use local override
    attempts,
    isLoading: statsLoading || attemptsLoading,
    isError: !!statsError || !!attemptsError,
    errors: {
      stats: statsError,
      attempts: attemptsError,
    },
  }
}
