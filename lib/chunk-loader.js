// Utility for handling webpack chunk loading with retry logic

let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Override webpack chunk loading to add retry logic
if (typeof window !== "undefined" && window.__webpack_require__) {
  const originalChunkLoading = window.__webpack_require__.e;

  window.__webpack_require__.e = function (chunkId) {
    return originalChunkLoading(chunkId).catch((error) => {
      if (error.name === "ChunkLoadError" && retryCount < MAX_RETRIES) {
        retryCount++;
        console.warn(
          `Chunk loading failed, retrying... (${retryCount}/${MAX_RETRIES})`
        );

        // Clear the failed chunk from cache
        if (window.__webpack_require__.c) {
          Object.keys(window.__webpack_require__.c).forEach((key) => {
            if (key.includes(chunkId)) {
              delete window.__webpack_require__.c[key];
            }
          });
        }

        // Wait before retrying
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(originalChunkLoading(chunkId));
          }, RETRY_DELAY * retryCount);
        });
      }

      // Reset retry count on success or max retries reached
      retryCount = 0;
      throw error;
    });
  };
}

// Function to manually retry chunk loading
export function retryChunkLoading(chunkId) {
  if (typeof window !== "undefined" && window.__webpack_require__) {
    retryCount = 0;
    return window.__webpack_require__.e(chunkId);
  }
  return Promise.reject(new Error("Webpack not available"));
}

// Function to clear chunk cache
export function clearChunkCache() {
  if (
    typeof window !== "undefined" &&
    window.__webpack_require__ &&
    window.__webpack_require__.c
  ) {
    Object.keys(window.__webpack_require__.c).forEach((key) => {
      delete window.__webpack_require__.c[key];
    });
    console.log("Chunk cache cleared");
  }
}

// Function to reload page if chunk loading fails completely
export function handleChunkLoadFailure() {
  console.error("Chunk loading failed completely, reloading page...");
  setTimeout(() => {
    window.location.reload();
  }, 2000);
}

export default {
  retryChunkLoading,
  clearChunkCache,
  handleChunkLoadFailure,
};
