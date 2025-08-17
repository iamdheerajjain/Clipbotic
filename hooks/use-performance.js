import { useEffect, useRef, useCallback } from "react";

// Performance monitoring hook
export function usePerformance(componentName) {
  const mountTime = useRef(performance.now());
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());

  // Track render performance
  useEffect(() => {
    renderCount.current += 1;
    const now = performance.now();
    const renderTime = now - lastRenderTime.current;
    lastRenderTime.current = now;

    // Log performance metrics in development
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[${componentName}] Render #${
          renderCount.current
        } took ${renderTime.toFixed(2)}ms`
      );
    }

    // Performance warning for slow renders
    if (renderTime > 16) {
      // 16ms = 60fps threshold
      console.warn(
        `[${componentName}] Slow render detected: ${renderTime.toFixed(2)}ms`
      );
    }
  });

  // Track mount time
  useEffect(() => {
    const mountDuration = performance.now() - mountTime.current;

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[${componentName}] Mounted in ${mountDuration.toFixed(2)}ms`
      );
    }

    // Performance warning for slow mounts
    if (mountDuration > 100) {
      console.warn(
        `[${componentName}] Slow mount detected: ${mountDuration.toFixed(2)}ms`
      );
    }
  }, [componentName]);

  // Utility function to measure async operations
  const measureAsync = useCallback(
    async (operationName, asyncFn) => {
      const start = performance.now();
      try {
        const result = await asyncFn();
        const duration = performance.now() - start;

        if (process.env.NODE_ENV === "development") {
          console.log(
            `[${componentName}] ${operationName} completed in ${duration.toFixed(
              2
            )}ms`
          );
        }

        return result;
      } catch (error) {
        const duration = performance.now() - start;
        console.error(
          `[${componentName}] ${operationName} failed after ${duration.toFixed(
            2
          )}ms:`,
          error
        );
        throw error;
      }
    },
    [componentName]
  );

  // Utility function to measure sync operations
  const measureSync = useCallback(
    (operationName, syncFn) => {
      const start = performance.now();
      try {
        const result = syncFn();
        const duration = performance.now() - start;

        if (process.env.NODE_ENV === "development") {
          console.log(
            `[${componentName}] ${operationName} completed in ${duration.toFixed(
              2
            )}ms`
          );
        }

        return result;
      } catch (error) {
        const duration = performance.now() - start;
        console.error(
          `[${componentName}] ${operationName} failed after ${duration.toFixed(
            2
          )}ms:`,
          error
        );
        throw error;
      }
    },
    [componentName]
  );

  return {
    renderCount: renderCount.current,
    measureAsync,
    measureSync,
    getMountTime: () => performance.now() - mountTime.current,
  };
}

// Hook for measuring page navigation performance
export function useNavigationPerformance() {
  const navigationStart = useRef(performance.now());
  const navigationType = useRef("");

  useEffect(() => {
    // Track navigation start
    const handleNavigationStart = () => {
      navigationStart.current = performance.now();
      navigationType.current = "navigation";
    };

    // Track navigation end
    const handleNavigationEnd = () => {
      const duration = performance.now() - navigationStart.current;

      if (process.env.NODE_ENV === "development") {
        console.log(`Navigation completed in ${duration.toFixed(2)}ms`);
      }

      // Performance warning for slow navigation
      if (duration > 1000) {
        console.warn(`Slow navigation detected: ${duration.toFixed(2)}ms`);
      }
    };

    // Listen for navigation events
    window.addEventListener("beforeunload", handleNavigationStart);
    window.addEventListener("load", handleNavigationEnd);

    return () => {
      window.removeEventListener("beforeunload", handleNavigationStart);
      window.removeEventListener("load", handleNavigationEnd);
    };
  }, []);

  return {
    getNavigationTime: () => performance.now() - navigationStart.current,
    navigationType: navigationType.current,
  };
}

// Hook for measuring API call performance
export function useAPIPerformance() {
  const apiCallTimes = useRef(new Map());

  const measureAPI = useCallback(async (apiName, apiCall) => {
    const start = performance.now();
    try {
      const result = await apiCall();
      const duration = performance.now() - start;

      // Store timing data
      if (!apiCallTimes.current.has(apiName)) {
        apiCallTimes.current.set(apiName, []);
      }
      apiCallTimes.current.get(apiName).push(duration);

      if (process.env.NODE_ENV === "development") {
        console.log(`[API] ${apiName} completed in ${duration.toFixed(2)}ms`);
      }

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(
        `[API] ${apiName} failed after ${duration.toFixed(2)}ms:`,
        error
      );
      throw error;
    }
  }, []);

  const getAPIAverageTime = useCallback((apiName) => {
    const times = apiCallTimes.current.get(apiName);
    if (!times || times.length === 0) return 0;

    const sum = times.reduce((acc, time) => acc + time, 0);
    return sum / times.length;
  }, []);

  const getAPIStats = useCallback(() => {
    const stats = {};
    for (const [apiName, times] of apiCallTimes.current) {
      if (times.length > 0) {
        const avg = times.reduce((acc, time) => acc + time, 0) / times.length;
        const min = Math.min(...times);
        const max = Math.max(...times);
        stats[apiName] = { avg, min, max, count: times.length };
      }
    }
    return stats;
  }, []);

  return {
    measureAPI,
    getAPIAverageTime,
    getAPIStats,
  };
}
