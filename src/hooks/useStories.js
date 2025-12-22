import { useQuery } from "@tanstack/react-query"
import { storiesApi } from "../lib/api"

export const storyKeys = {
  all: ["stories"],
  detail: (id) => [...storyKeys.all, "detail", id],
}

/**
 * Hook to fetch a story by ID
 * @param {string} id
 */
export function useStory(id) {
  return useQuery({
    queryKey: storyKeys.detail(id),
    queryFn: () => storiesApi.get(id),
    enabled: !!id,
  })
}
