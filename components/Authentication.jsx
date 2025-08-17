"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/app/providers";
import { withErrorHandling } from "@/lib/error-handler";

export default function Authentication({ children }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { signIn } = useAuthContext();

  const handleSignIn = withErrorHandling(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await signIn();
      // Navigate to dashboard after successful sign-in
      router.push("/dashboard");
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  });

  return (
    <div className="relative">
      {React.cloneElement(children, {
        onClick: handleSignIn,
        disabled: isLoading,
        children: isLoading ? "Signing in..." : children.props.children,
      })}

      {error && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
