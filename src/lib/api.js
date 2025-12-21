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
   * @param {string} [storyId] - Optional filter by story
   * @returns {Promise<Array>}
   */
  list: (storyId) =>
    apiRequest(`/attempts${storyId ? `?storyId=${storyId}` : ""}`),

  /**
   * Get a specific attempt by ID
   * @param {string} id
   * @returns {Promise<object>}
   */
  get: (id) => apiRequest(`/attempts/${id}`),

  /**
   * Update an attempt
   * @param {string} id
   * @param {object} data
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
   * @param {object} stageData - { stageType, timeSpentSeconds, xpGained, score }
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
   * @param {object} logData - { questionId, selectedAnswer, isCorrect, timeSpentSeconds }
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
