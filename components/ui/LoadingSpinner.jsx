import React from "react";

const LoadingSpinner = React.memo(({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className={`animate-spin rounded-full border-b-2 border-current ${sizeClass} ${className}`}
    />
  );
});

LoadingSpinner.displayName = "LoadingSpinner";

export default LoadingSpinner;
