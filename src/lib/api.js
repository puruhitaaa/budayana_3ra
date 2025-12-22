/**
 * API client for backend communication
 * Base URL should be configured via environment variable
 */

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api"

/**
 * Make an API request with auth headers
 * @param {string} endpoint
 * @param {object} options
 * @returns {Promise<any>}
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // Include cookies for auth
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `API Error: ${response.status}`)
  }

  return response.json()
}

/**
 * API methods for Attempts
 */
export const attemptsApi = {
  /**
   * Start a new attempt for a story
   * @param {string} storyId
   * @returns {Promise<{id: string, ...}>}
   */
  start: (storyId) =>
    apiRequest("/attempts", {
      method: "POST",
      body: JSON.stringify({ storyId }),
    }),

  /**
   * Get all attempts for the current user
   * @param {string} [islandId] - Optional filter by island
   * @returns {Promise<Array>}
   */
  list: (islandId) =>
    apiRequest(`/attempts${islandId ? `?islandId=${islandId}` : ""}`),

  /**
   * Get a specific attempt by ID
   * @param {string} id
   * @returns {Promise<object>}
   */
  get: (id) => apiRequest(`/attempts/${id}`),

  /**
   * Update an attempt (mark as finished)
   * @param {string} id
   * @param {object} data - { finishedAt, totalTimeSeconds }
   * @returns {Promise<object>}
   */
  update: (id, data) =>
    apiRequest(`/attempts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  /**
   * Add a stage completion record
   * @param {string} attemptId
   * @param {object} stageData - { stageType, timeSpentSeconds, xpGained }
   * @returns {Promise<object>}
   */
  addStage: (attemptId, stageData) =>
    apiRequest(`/attempts/${attemptId}/stages`, {
      method: "POST",
      body: JSON.stringify(stageData),
    }),

  /**
   * Add a question attempt log
   * @param {string} attemptId
   * @param {object} logData - { questionId, selectedOptionId, attemptCount }
   * @returns {Promise<object>}
   */
  addLog: (attemptId, logData) =>
    apiRequest(`/attempts/${attemptId}/logs`, {
      method: "POST",
      body: JSON.stringify(logData),
    }),
}

/**
 * API methods for User Progress
 */
export const progressApi = {
  /**
   * Initialize progress for a new user
   * Called after successful signup to set up initial progress records
   * @returns {Promise<object>}
   */
  initialize: () =>
    apiRequest("/progress/initialize", {
      method: "POST",
    }),

  /**
   * Get current user's progress (all islands)
   * Returns paginated response with items array
   * @param {object} params - Query parameters (cursor, limit, sortBy, sortOrder, isUnlocked, isCompleted)
   * @returns {Promise<{items: Array, nextCursor: string, hasMore: boolean, totalCount: number}>}
   */
  getMyProgress: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(`/progress?${queryString}`)
  },

  /**
   * Get progress for a specific island
   * @param {string} islandId
   * @returns {Promise<object>}
   */
  getIslandProgress: (islandId) => apiRequest(`/progress/islands/${islandId}`),
}

/**
 * API methods for Islands
 */
export const islandsApi = {
  /**
   * Get public island details including stories
   * @param {string} id - Island ID or slug
   * @returns {Promise<object>}
   */
  getIsland: (id) => apiRequest(`/islands/${id}?includeStories=true`),
}

/**
 * API methods for Questions
 */
export const questionsApi = {
  /**
   * Get a paginated list of questions with optional filtering
   * @param {object} params - Query parameters
   * @param {string} [params.cursor] - Pagination cursor from previous response
   * @param {number} [params.limit] - Number of items per page (1-100, default: 20)
   * @param {string} [params.sortBy] - Field to sort by
   * @param {string} [params.sortOrder] - 'asc' or 'desc'
   * @param {string} [params.search] - Search query
   * @param {string} [params.storyId] - Filter by story ID
   * @param {string} [params.stageType] - Filter by stage type (PRE_TEST, POST_TEST, INTERACTIVE)
   * @param {string} [params.questionType] - Filter by question type (MCQ, TRUE_FALSE, DRAG_DROP, ESSAY)
   * @returns {Promise<{items: Array, nextCursor: string|null, hasMore: boolean, totalCount?: number}>}
   */
  list: (params = {}) => {
    const queryString = new URLSearchParams(
      Object.entries(params).filter(
        (entry) => entry[1] !== undefined && entry[1] !== null
      )
    ).toString()
    return apiRequest(`/questions${queryString ? `?${queryString}` : ""}`)
  },

  /**
   * Create a new question with optional answer options
   * @param {object} data - Question data
   * @returns {Promise<object>}
   */
  create: (data) =>
    apiRequest("/questions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
}
