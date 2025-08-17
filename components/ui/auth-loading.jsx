import React from "react";
import LoadingSpinner from "./LoadingSpinner";

const AuthLoading = ({ message = "Signing you in..." }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 relative z-10">
        <div className="relative flex justify-center">
          {/* Background glow effect */}
          <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-purple-500/20 rounded-full w-32 h-32" />

          {/* Main loading spinner */}
          <div className="relative flex items-center justify-center w-32 h-32">
            <LoadingSpinner size="xl" className="text-purple-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Welcome to Clipbotic
          </h2>
          <p className="text-muted-foreground animate-pulse">{message}</p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center space-x-1">
          <div
            className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
};

export default AuthLoading;
