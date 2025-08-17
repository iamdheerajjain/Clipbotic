"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { authService } from "@/lib/auth-service";
const AuthContext = createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    let unsubscribe;

    const initializeAuth = async () => {
      try {
        // Initialize auth service
        await authService.initialize();

        // Set initial user
        setUser(authService.getCurrentUser());
        setLoading(false);

        // Listen for auth state changes
        unsubscribe = authService.onAuthStateChanged((user) => {
          setUser(user);
          setLoading(false);
          setSigningIn(false); // Reset signing in state when auth state changes
        });
      } catch (error) {
        console.error("Auth initialization error:", error);
        setLoading(false);
        setSigningIn(false);
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

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await authService.signInWithGoogle();
    } catch (error) {
      setSigningIn(false);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signingIn,
        signIn: handleSignIn,
        signOut: authService.signOut.bind(authService),
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
