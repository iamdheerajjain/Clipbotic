"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { authService } from "@/lib/auth-service";
const AuthContext = createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
        });
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

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn: authService.signInWithGoogle.bind(authService),
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
