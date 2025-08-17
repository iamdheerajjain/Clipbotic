import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabaseService } from "@/lib/supabase-service";

// Cache for storing query results
const queryCache = new Map();
const cacheTimeout = 5 * 60 * 1000; // 5 minutes

// Hook for queries (similar to useQuery)
export function useSupabaseQuery(queryFn, dependencies = [], options = {}) {
  const {
    enabled = true,
    cacheTime = cacheTimeout,
    staleTime = 0,
    refetchOnWindowFocus = false,
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const queryKey = useMemo(() => {
    return JSON.stringify({ queryFn: queryFn.toString(), dependencies });
  }, [queryFn, dependencies]);

  const cacheKey = useMemo(() => {
    return `query_${queryKey}`;
  }, [queryKey]);

  const fetchData = useCallback(
    async (force = false) => {
      try {
        // Check cache first
        const cached = queryCache.get(cacheKey);
        const now = Date.now();

        if (!force && cached && now - cached.timestamp < cacheTime) {
          setData(cached.data);
          setLastFetched(cached.timestamp);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        const result = await queryFn();

        // Cache the result
        queryCache.set(cacheKey, {
          data: result,
          timestamp: now,
        });

        setData(result);
        setLastFetched(now);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [queryFn, cacheKey, cacheTime]
  );

  // Memoized refetch function
  const refetch = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  // Check if data is stale
  const isStale = useMemo(() => {
    if (!lastFetched || staleTime === 0) return false;
    return Date.now() - lastFetched > staleTime;
  }, [lastFetched, staleTime]);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData]);

  // Window focus refetch
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (isStale) {
        refetch();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refetchOnWindowFocus, isStale, refetch]);

  // Cleanup cache on unmount
  useEffect(() => {
    return () => {
      // Keep cache for a bit longer in case component remounts
      setTimeout(() => {
        queryCache.delete(cacheKey);
      }, cacheTime);
    };
  }, [cacheKey, cacheTime]);

  return {
    data,
    loading,
    error,
    refetch,
    isStale,
    lastFetched,
  };
}

// Hook for mutations (similar to useMutation)
export function useSupabaseMutation(mutationFn, options = {}) {
  const { onSuccess, onError, onSettled, optimisticUpdate } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const mutate = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError(null);

        // Apply optimistic update if provided
        if (optimisticUpdate) {
          optimisticUpdate(...args);
        }

        const result = await mutationFn(...args);
        setData(result);

        if (onSuccess) {
          onSuccess(result, ...args);
        }

        return result;
      } catch (err) {
        setError(err);

        if (onError) {
          onError(err, ...args);
        }

        throw err;
      } finally {
        setLoading(false);

        if (onSettled) {
          onSettled(data, error, ...args);
        }
      }
    },
    [mutationFn, onSuccess, onError, onSettled, optimisticUpdate]
  );

  return { mutate, loading, error, data };
}

// Specific hooks for common operations with better caching
export function useUsers() {
  return useSupabaseQuery(() => supabaseService.getAllUsers(), [], {
    cacheTime: 10 * 60 * 1000, // 10 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUserByEmail(email) {
  return useSupabaseQuery(
    () => supabaseService.getUserByEmail(email),
    [email],
    {
      enabled: !!email,
      cacheTime: 10 * 60 * 1000,
      staleTime: 5 * 60 * 1000,
    }
  );
}

export function useVideosByEmail(email) {
  return useSupabaseQuery(
    () => supabaseService.getVideosByEmail(email),
    [email],
    {
      enabled: !!email,
      cacheTime: 2 * 60 * 1000, // 2 minutes for videos
      staleTime: 1 * 60 * 1000, // 1 minute
    }
  );
}

export function useAllVideos() {
  return useSupabaseQuery(() => supabaseService.getAllVideos(), [], {
    cacheTime: 2 * 60 * 1000,
    staleTime: 1 * 60 * 1000,
  });
}

export function useVideoById(videoId) {
  return useSupabaseQuery(
    () => supabaseService.getVideoById(videoId),
    [videoId],
    {
      enabled: !!videoId,
      cacheTime: 5 * 60 * 1000,
      staleTime: 2 * 60 * 1000,
    }
  );
}

export function useCreateUser() {
  return useSupabaseMutation(
    supabaseService.createNewUser.bind(supabaseService)
  );
}

export function useCreateVideo() {
  return useSupabaseMutation(
    supabaseService.createVideoData.bind(supabaseService)
  );
}

export function useUpdateVideo() {
  return useSupabaseMutation(
    supabaseService.updateVideoData.bind(supabaseService)
  );
}

export function useDeleteVideo() {
  return useSupabaseMutation(
    supabaseService.deleteVideoData.bind(supabaseService)
  );
}

export function useTestDatabase() {
  return useSupabaseMutation(
    supabaseService.testDatabaseConnection.bind(supabaseService)
  );
}

export function useCreateTestVideo() {
  return useSupabaseMutation(
    supabaseService.createSimpleTestVideo.bind(supabaseService)
  );
}

// Utility function to clear cache
export function clearQueryCache(pattern = null) {
  if (pattern) {
    for (const [key] of queryCache) {
      if (key.includes(pattern)) {
        queryCache.delete(key);
      }
    }
  } else {
    queryCache.clear();
  }
}

// Utility function to get cache stats
export function getCacheStats() {
  return {
    size: queryCache.size,
    keys: Array.from(queryCache.keys()),
  };
}
