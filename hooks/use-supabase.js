import { useState, useEffect, useCallback } from "react";
import { supabaseService } from "@/lib/supabase-service";
import { supabase } from "@/configs/supabase";

export function useQuery(queryFn, args = {}, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!queryFn || typeof queryFn !== "function") {
      setData(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const result = await queryFn(args);
      setData(result);
    } catch (err) {
      setError(err);
      console.error("Query error:", err);
    } finally {
      setLoading(false);
    }
  }, [queryFn, args]);

  useEffect(() => {
    fetchData();
    let interval;
    if (options.refetchInterval && options.refetchInterval > 0) {
      interval = setInterval(fetchData, options.refetchInterval);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [fetchData, options.refetchInterval]);

  return data;
}

export function useMutation(mutationFn) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(
    async (args) => {
      try {
        setLoading(true);
        setError(null);
        const result = await mutationFn(args);
        return result;
      } catch (err) {
        setError(err);
        console.error("Mutation error:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [mutationFn]
  );

  return [mutate, { loading, error }];
}

export function useGetAllUsers() {
  return useQuery(supabaseService.getAllUsers.bind(supabaseService));
}

export function useGetAllVideos() {
  return useQuery(supabaseService.getAllVideos.bind(supabaseService));
}

export function useGetUserVideos(userId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const cacheKey = `user_videos_${userId}`;
      const cachedData = localStorage.getItem(cacheKey);

      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          const cacheAge = Date.now() - parsed.timestamp;

          if (cacheAge < 5 * 60 * 1000) {
            setData(parsed.data);
            setLoading(false);

            setTimeout(async () => {
              try {
                let freshData;
                if (userId.length === 28) {
                  const currentUser = JSON.parse(
                    localStorage.getItem("currentUser") || "{}"
                  );
                  if (currentUser.email) {
                    freshData = await supabaseService.getVideosByEmail(
                      currentUser.email
                    );
                  } else {
                    freshData = [];
                  }
                } else if (userId.length === 36) {
                  freshData = await supabaseService.getUserVideos(userId);
                } else {
                  console.warn("Invalid user ID format:", userId);
                  freshData = [];
                }

                if (freshData) {
                  setData(freshData);
                  localStorage.setItem(
                    cacheKey,
                    JSON.stringify({
                      data: freshData,
                      timestamp: Date.now(),
                    })
                  );
                }
              } catch (err) {
                console.warn(
                  "Background refresh failed, keeping cached data:",
                  err
                );
              }
            }, 100);

            return;
          }
        } catch (err) {
          console.warn("Failed to parse cached data:", err);
        }
      }

      // Fetch fresh data
      let result;
      // If it's a Firebase UID (28 characters), use email-based approach
      if (userId.length === 28) {
        // Get user email from auth context or localStorage
        const currentUser = JSON.parse(
          localStorage.getItem("currentUser") || "{}"
        );
        if (currentUser.email) {
          result = await supabaseService.getVideosByEmail(currentUser.email);
        } else {
          // Fallback to empty array for Firebase UIDs without email
          result = [];
        }
      } else if (userId.length === 36) {
        // Use UUID-based approach for Supabase IDs
        result = await supabaseService.getUserVideos(userId);
      } else {
        // Invalid user ID format
        console.warn("Invalid user ID format:", userId);
        result = [];
      }

      setData(result);

      // Cache the result
      if (result) {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            data: result,
            timestamp: Date.now(),
          })
        );
      }
    } catch (err) {
      setError(err);
      console.error("Query error:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleVideosUpdated = () => {
      fetchData();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("videos-updated", handleVideosUpdated);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("videos-updated", handleVideosUpdated);
      }
    };
  }, [fetchData]);

  useEffect(() => {
    if (!userId || userId.length !== 36) return; // Realtime keyed by Supabase UUID only

    const channel = supabase
      .channel(`videos-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "video_data",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Invalidate cache and refetch
          invalidateUserVideosCache(userId);
          fetchData();
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, [userId, fetchData]);

  return data;
}

export function invalidateUserVideosCache(userId) {
  if (userId) {
    const cacheKey = `user_videos_${userId}`;
    localStorage.removeItem(cacheKey);
  }
}

export function invalidateAllVideosCache() {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("user_videos_")) {
      localStorage.removeItem(key);
    }
  });
}

export function getCachedUserVideos(userId) {
  if (!userId) return null;

  try {
    const cacheKey = `user_videos_${userId}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      const cacheAge = Date.now() - parsed.timestamp;

      // Return cached data if it's less than 5 minutes old
      if (cacheAge < 5 * 60 * 1000) {
        return parsed.data;
      }
    }
  } catch (err) {
    console.warn("Failed to get cached data:", err);
  }

  return null;
}

export function useGetVideosByEmail(email) {
  const queryFn =
    email && email.trim()
      ? supabaseService.getVideosByEmail.bind(supabaseService)
      : null;

  return useQuery(queryFn, email);
}

export function useGetVideoById(videoId) {
  const queryFn =
    videoId && videoId.trim()
      ? supabaseService.getVideoById.bind(supabaseService)
      : null;

  return useQuery(queryFn, videoId);
}

export function useGetUserByEmail(email) {
  const queryFn =
    email && email.trim()
      ? supabaseService.getUserByEmail.bind(supabaseService)
      : null;

  return useQuery(queryFn, email);
}

export function useTestConnection() {
  return useQuery(supabaseService.testConnection.bind(supabaseService));
}

export function useDetailedAnalysis() {
  return useQuery(supabaseService.getDetailedAnalysis.bind(supabaseService));
}

// Specific mutation hooks
export function useCreateUser() {
  return useMutation(supabaseService.createUser.bind(supabaseService));
}

export function useCreateVideo() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (videoData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await supabaseService.createVideo(videoData);

      if (result && videoData.userId) {
        invalidateUserVideosCache(videoData.userId);
      }

      // Notify any listeners to refetch immediately
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("videos-updated"));
      }

      return result;
    } catch (err) {
      setError(err);
      console.error("Mutation error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return [mutate, { loading, error }];
}

export function useUpdateVideo() {
  const [mutate, { loading, error }] = useMutation(
    supabaseService.updateVideo.bind(supabaseService)
  );

  const wrappedMutate = useCallback(
    async (...args) => {
      const res = await mutate(...args);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("videos-updated"));
      }
      return res;
    },
    [mutate]
  );

  return [wrappedMutate, { loading, error }];
}

export function useDeleteVideo() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (videoId, userId) => {
    try {
      setLoading(true);
      setError(null);
      const result = await supabaseService.deleteVideo(videoId, userId);

      // Invalidate cache after successful deletion
      if (result && userId) {
        invalidateUserVideosCache(userId);
      }

      // Broadcast change so any open views refetch
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("videos-updated"));
      }

      return result;
    } catch (err) {
      setError(err);
      console.error("Mutation error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return [mutate, { loading, error }];
}
