import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { attemptsApi } from "../lib/api"

/**
 * Query keys for attempts
 */
const attemptKeys = {
  all: ["attempts"],
  list: (islandId) => [...attemptKeys.all, "list", islandId],
  detail: (id) => [...attemptKeys.all, "detail", id],
}

/**
 * Hook to fetch attempts for an island
 * @param {string} islandId
 */
export function useAttempts(islandId) {
  return useQuery({
    queryKey: attemptKeys.list(islandId),
    queryFn: () => attemptsApi.list(islandId),
    enabled: !!islandId,
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
 * Check if a specific story has been finished (has an attempt with finishedAt)
 * @param {array} attempts - List of attempts from API
 * @param {string} storyId - The story ID to check
 * @returns {boolean}
 */
export function isStoryFinished(attempts, storyId) {
  if (!attempts?.length || !storyId) return false

  return attempts.some(
    (attempt) => attempt.storyId === storyId && attempt.finishedAt !== null
  )
}

/**
 * Get the unlock status for each story based on sequential completion
 * A story is unlocked if:
 * - It's the first story (order 1), OR
 * - The previous story (lower order) has been finished
 *
 * @param {array} stories - Array of stories with id and order properties
 * @param {array} attempts - List of attempts from API
 * @returns {object} - Map of storyId to { isUnlocked: boolean, isFinished: boolean }
 */
export function getStoryUnlockStatus(stories, attempts) {
  if (!stories?.length) return {}

  // Sort stories by order
  const sortedStories = [...stories].sort((a, b) => a.order - b.order)

  const statusMap = {}

  sortedStories.forEach((story, index) => {
    const isFinished = isStoryFinished(attempts, story.id)

    // First story is always unlocked
    if (index === 0) {
      statusMap[story.id] = { isUnlocked: true, isFinished }
      return
    }

    // Check if previous story is finished
    const previousStory = sortedStories[index - 1]
    const previousFinished = isStoryFinished(attempts, previousStory.id)

    statusMap[story.id] = { isUnlocked: previousFinished, isFinished }
  })

  return statusMap
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
