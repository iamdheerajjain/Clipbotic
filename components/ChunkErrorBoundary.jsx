"use client";

import { Component } from "react";

class ChunkErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Check if it's a chunk loading error
    if (
      error.name === "ChunkLoadError" ||
      error.message.includes("ChunkLoadError")
    ) {
      return { hasError: true, error };
    }
    return null;
  }

  componentDidCatch(error, errorInfo) {
    console.error("ChunkErrorBoundary caught an error:", error, errorInfo);

    // If it's a chunk loading error, try to reload the page
    if (
      error.name === "ChunkLoadError" ||
      error.message.includes("ChunkLoadError")
    ) {
      console.log("Attempting to reload page due to chunk loading error...");
      // Wait a bit before reloading to avoid infinite loops
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Chunk Loading Error
            </h2>
            <p className="text-gray-600 mb-4">
              There was an issue loading some parts of the application. The page
              will reload automatically.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Reload Now
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChunkErrorBoundary;
