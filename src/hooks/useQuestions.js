/**
 * React Query hooks for Questions
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { questionsApi } from "../lib/api"

/**
 * Query keys for questions
 */
const questionKeys = {
  all: ["questions"],
  list: (filters) => [...questionKeys.all, "list", filters],
}

/**
 * Hook to fetch a paginated list of questions with optional filtering
 * @param {object} params - Query parameters
 * @param {string} [params.storyId] - Filter by story ID
 * @param {string} [params.stageType] - Filter by stage type (PRE_TEST, POST_TEST, INTERACTIVE)
 * @param {string} [params.questionType] - Filter by question type (MCQ, TRUE_FALSE, DRAG_DROP, ESSAY)
 * @param {string} [params.cursor] - Pagination cursor
 * @param {number} [params.limit] - Items per page
 * @param {string} [params.sortBy] - Field to sort by
 * @param {string} [params.sortOrder] - 'asc' or 'desc'
 * @param {string} [params.search] - Search query
 * @param {boolean} [params.public] - Filter by public status
 * @returns {object} TanStack Query query object
 */
export function useQuestions(params = {}) {
  return useQuery({
    queryKey: questionKeys.list(params),
    queryFn: () => questionsApi.list(params),
    enabled: !!(params.storyId && params.stageType && params.public), // Only fetch when both required params are present
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to create a new question
 * @returns {object} TanStack Query mutation object
 */
export function useCreateQuestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => questionsApi.create(data),
    onSuccess: () => {
      // Invalidate all question lists to refetch
      queryClient.invalidateQueries({ queryKey: questionKeys.all })
    },
  })
}
