import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep cached data for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Don't refetch on window focus for better UX
      refetchOnWindowFocus: false,
      // Refetch on mount if data is stale
      refetchOnMount: true,
      // Enable background refetching
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
})
