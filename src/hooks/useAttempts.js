import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { attemptsApi } from "../lib/api"

/**
 * Query keys for attempts
 */
const attemptKeys = {
  all: ["attempts"],
  list: (storyId) => [...attemptKeys.all, "list", storyId],
  detail: (id) => [...attemptKeys.all, "detail", id],
}

/**
 * Hook to fetch attempts for a story
 * @param {string} storyId
 */
export function useAttempts(storyId) {
  return useQuery({
    queryKey: attemptKeys.list(storyId),
    queryFn: () => attemptsApi.list(storyId),
    enabled: !!storyId,
  })
}

/**
 * Hook to fetch a specific attempt
 * @param {string} attemptId
 */
export function useAttempt(attemptId) {
  return useQuery({
    queryKey: attemptKeys.detail(attemptId),
    queryFn: () => attemptsApi.get(attemptId),
    enabled: !!attemptId,
  })
}

/**
 * Hook to start a new attempt
 */
export function useStartAttempt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (storyId) => attemptsApi.start(storyId),
    onSuccess: (data, storyId) => {
      // Invalidate the list query to refetch
      queryClient.invalidateQueries({ queryKey: attemptKeys.list(storyId) })
    },
  })
}

/**
 * Hook to update an attempt
 */
export function useUpdateAttempt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ attemptId, data }) => attemptsApi.update(attemptId, data),
    onSuccess: (result, { attemptId }) => {
      queryClient.invalidateQueries({ queryKey: attemptKeys.detail(attemptId) })
      queryClient.invalidateQueries({ queryKey: attemptKeys.all })
    },
  })
}

/**
 * Hook to add a stage completion
 */
export function useAddStage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ attemptId, stageData }) =>
      attemptsApi.addStage(attemptId, stageData),
    onSuccess: (result, { attemptId }) => {
      queryClient.invalidateQueries({ queryKey: attemptKeys.detail(attemptId) })
    },
  })
}

/**
 * Hook to add a question log
 */
export function useAddQuestionLog() {
  return useMutation({
    mutationFn: ({ attemptId, logData }) =>
      attemptsApi.addLog(attemptId, logData),
  })
}

/**
 * Check if a stage has been completed for a story
 * @param {array} attempts - List of attempts
 * @param {string} stageType - PRE_TEST, STORY, POST_TEST
 * @returns {boolean}
 */
export function isStageCompleted(attempts, stageType) {
  if (!attempts?.length) return false

  // Check if any attempt has this stage completed
  return attempts.some((attempt) =>
    attempt.stages?.some((stage) => stage.stageType === stageType)
  )
}

/**
 * Get the latest attempt for a story
 * @param {array} attempts
 * @returns {object|null}
 */
export function getLatestAttempt(attempts) {
  if (!attempts?.length) return null

  return attempts.sort(
    (a, b) => new Date(b.startedAt) - new Date(a.startedAt)
  )[0]
}

/**
 * Map URL stage to API stage type
 */
export const stageTypeMap = {
  "pre-test": "PRE_TEST",
  story: "STORY",
  game: "STORY", // Games are part of the story stage in API
  "post-test": "POST_TEST",
}
