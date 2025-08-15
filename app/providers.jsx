"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { authService } from "@/lib/auth-service";

const AuthContext = createContext();

function AuthProvider({ children }) {
  // Start with SSR-safe defaults to avoid hydration mismatch
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe;

    const initializeAuth = async () => {
      try {
        // Subscribe early so we don't miss the first emission
        unsubscribe = authService.onAuthStateChanged((u) => {
          setUser(u);
          setLoading(false);
        });

        // Set an immediate snapshot before async init completes
        const immediate = authService.getUserStatusImmediately();
        if (immediate.status === "authenticated") {
          setUser(immediate.user);
          setLoading(false);
        } else {
          // Keep loading until Firebase confirms, to avoid false unauthenticated flashes
          setLoading(true);
        }

        // Initialize Firebase listener (resolves after first auth state arrives)
        await authService.initialize();

        // Sync state from service once initialized (in case first event fired before subscribe)
        const updatedUser = authService.getCurrentUser();
        if (updatedUser !== user) {
          setUser(updatedUser);
        }
        setLoading(false);
      } catch (error) {
        console.error("Auth initialization error:", error);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      authService.cleanup();
    };
  }, []);

  const signIn = async () => {
    try {
      const result = await authService.signInWithGoogle();
      return result;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      if (typeof window !== "undefined") {
        localStorage.removeItem("currentUser");
      }
      setUser(null);
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
        isAuthenticated: authService.isAuthenticated.bind(authService),
        hasPermission: authService.hasPermission.bind(authService),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function Providers({ children }) {
  return (
    <AuthProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        {children}
      </NextThemesProvider>
    </AuthProvider>
  );
}

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};

export { AuthContext };
