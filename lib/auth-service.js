// Secure authentication service
import { auth } from "@/configs/firebaseconfig";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { supabaseService } from "./supabase-service";
import { AppError, AuthenticationError } from "./error-handler";

class AuthService {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = new Set();
    this.isInitialized = false;
  }

  // Convert Firebase user to a serializable, minimal object we can cache
  mapFirebaseUserToPlain(user, extras = {}) {
    if (!user) return null;
    return {
      uid: user.uid || null,
      displayName: user.displayName || null,
      email: user.email || null,
      photoURL: user.photoURL || null,
      _id: user.uid || null,
      supabaseId: extras.supabaseId || null,
    };
  }

  // Try restore user from localStorage cache (client-side only)
  restoreUserFromCache() {
    try {
      if (typeof window === "undefined") return null;
      const cached = localStorage.getItem("currentUser");
      if (!cached) return null;
      const parsed = JSON.parse(cached);
      if (parsed && parsed.uid) {
        this.currentUser = parsed;
        return this.currentUser;
      }
      return null;
    } catch {
      return null;
    }
  }

  // Initialize authentication service
  async initialize() {
    if (this.isInitialized) return;

    // If we already have a cached user, keep it until Firebase confirms
    this.restoreUserFromCache();

    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            // Use minimal, serializable user object for instant UI
            const plainUser = this.mapFirebaseUserToPlain(firebaseUser);
            this.currentUser = plainUser;

            // Store user data in localStorage for instant hydration
            if (typeof window !== "undefined") {
              localStorage.setItem(
                "currentUser",
                JSON.stringify(this.currentUser)
              );
            }

            // Sync with Supabase in background (don't wait)
            this.syncWithSupabaseInBackground(firebaseUser);
          } else {
            this.currentUser = null;
            // Clear user data from localStorage
            if (typeof window !== "undefined") {
              localStorage.removeItem("currentUser");
            }
          }

          // Notify all listeners immediately
          this.authStateListeners.forEach((listener) => {
            try {
              listener(this.currentUser);
            } catch (error) {
              console.error("Auth state listener error:", error);
            }
          });

          if (!this.isInitialized) {
            this.isInitialized = true;
            resolve();
          }
        } catch (error) {
          console.error("Auth initialization error:", error);
          this.currentUser = null;
          if (typeof window !== "undefined") {
            localStorage.removeItem("currentUser");
          }
          if (!this.isInitialized) {
            this.isInitialized = true;
            resolve();
          }
        }
      });

      // Store unsubscribe function
      this.unsubscribe = unsubscribe;
    });
  }

  // Sync with Supabase in background without blocking
  async syncWithSupabaseInBackground(firebaseUser) {
    if (
      process.env.NODE_ENV === "development" &&
      process.env.SKIP_SUPABASE_SYNC === "true"
    ) {
      // Skip Supabase sync for faster development startup
      return;
    }

    try {
      const supabaseUser = await this.getOrCreateSupabaseUser(firebaseUser);

      if (this.currentUser && supabaseUser) {
        this.currentUser._id = supabaseUser.id;
        this.currentUser.supabaseId = supabaseUser.id;

        if (typeof window !== "undefined") {
          localStorage.setItem("currentUser", JSON.stringify(this.currentUser));
        }

        this.authStateListeners.forEach((listener) => {
          try {
            listener(this.currentUser);
          } catch (error) {
            console.error("Auth state listener error:", error);
          }
        });

        this.preloadUserVideos(supabaseUser.id);
      }
    } catch (error) {
      console.warn("Background Supabase sync failed:", error);
    }
  }

  // Preload user videos data for faster access
  async preloadUserVideos(userId) {
    try {
      // Preload immediately - no delay
      let videos;

      // If it's a Firebase UID (28 characters), use email-based approach
      if (userId && userId.length === 28) {
        // Get user email from current user
        if (this.currentUser && this.currentUser.email) {
          videos = await supabaseService.getVideosByEmail(
            this.currentUser.email
          );
        } else {
          console.warn("Cannot preload videos: Firebase UID without email");
          return;
        }
      } else if (userId && userId.length === 36) {
        // Use UUID-based approach for Supabase IDs
        videos = await supabaseService.getUserVideos(userId);
      } else {
        console.warn("Invalid user ID format for preloading videos:", userId);
        return;
      }

      if (videos) {
        // Cache the videos data
        const cacheKey = `user_videos_${userId}`;
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            data: videos,
            timestamp: Date.now(),
          })
        );
      }
    } catch (error) {
      console.warn("Failed to preload user videos:", error);
    }
  }

  // Get or create Supabase user
  async getOrCreateSupabaseUser(firebaseUser) {
    try {
      // Try to get existing user
      let supabaseUser = await supabaseService.getUserByEmail(
        firebaseUser.email
      );

      if (!supabaseUser) {
        // Create new user if doesn't exist
        supabaseUser = await supabaseService.createUser({
          name:
            firebaseUser.displayName ||
            firebaseUser.email?.split("@")[0] ||
            "Unknown User",
          email: firebaseUser.email,
          pictureURL: firebaseUser.photoURL || "",
        });
      }

      return supabaseUser;
    } catch (error) {
      console.error("Error getting/creating Supabase user:", error);
      throw new AppError("Failed to authenticate user", 500);
    }
  }

  // Sign in with Google
  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
      });

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (!credential?.accessToken) {
        throw new AuthenticationError("Failed to get access token");
      }

      return result.user;
    } catch (error) {
      console.error("Google sign-in error:", error);

      if (error.code === "auth/popup-closed-by-user") {
        throw new AuthenticationError("Sign-in was cancelled");
      } else if (error.code === "auth/popup-blocked") {
        throw new AuthenticationError(
          "Pop-up was blocked. Please allow pop-ups for this site"
        );
      } else if (error.code === "auth/network-request-failed") {
        throw new AuthenticationError(
          "Network error. Please check your connection"
        );
      } else if (error.code === "auth/unauthorized-domain") {
        throw new AuthenticationError(
          "This domain is not authorized for sign-in"
        );
      } else {
        throw new AuthenticationError("Sign-in failed. Please try again");
      }
    }
  }

  // Sign out
  async signOut() {
    try {
      await firebaseSignOut(auth);
      this.currentUser = null;
      return true;
    } catch (error) {
      console.error("Sign-out error:", error);
      throw new AppError("Failed to sign out", 500);
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Get current user immediately (even before full initialization)
  getCurrentUserImmediately() {
    if (this.currentUser) {
      return this.currentUser;
    }

    const cached = this.restoreUserFromCache();
    if (cached) {
      return cached;
    }

    const firebaseUser = this.getFirebaseUserImmediately();
    if (firebaseUser) {
      return this.mapFirebaseUserToPlain(firebaseUser);
    }

    return null;
  }

  // Get user status immediately (authenticated, loading, or unauthenticated)
  getUserStatusImmediately() {
    if (this.currentUser) {
      return { status: "authenticated", user: this.currentUser };
    }

    const cached = this.restoreUserFromCache();
    if (cached) {
      return { status: "authenticated", user: cached };
    }

    const firebaseUser = this.getFirebaseUserImmediately();
    if (firebaseUser) {
      return {
        status: "authenticated",
        user: this.mapFirebaseUserToPlain(firebaseUser),
      };
    }

    if (this.isInitialized) {
      return { status: "unauthenticated", user: null };
    }

    return { status: "loading", user: null };
  }

  // Check Firebase auth state immediately (no waiting)
  getFirebaseUserImmediately() {
    return auth.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentUser;
  }

  // Check if service is ready (initialized or has immediate user)
  isReady() {
    return this.isInitialized || !!this.getFirebaseUserImmediately();
  }

  // Check if user has valid Supabase ID for database operations
  hasValidSupabaseId() {
    return (
      this.currentUser &&
      this.currentUser.supabaseId &&
      this.currentUser.supabaseId !== this.currentUser.uid
    );
  }

  // Get valid Supabase ID for database operations
  getValidSupabaseId() {
    if (this.hasValidSupabaseId()) {
      return this.currentUser.supabaseId;
    }
    return null;
  }

  // Check if user is ready for database operations
  isReadyForDatabase() {
    return this.hasValidSupabaseId() && this.isInitialized;
  }

  // Check if we should wait for Supabase sync
  shouldWaitForSupabase() {
    if (process.env.NODE_ENV === "development") {
      return false;
    }
    return true;
  }

  // Check if user has specific permission
  hasPermission(permission) {
    if (!this.currentUser) return false;
    switch (permission) {
      case "create_video":
        return true;
      case "delete_video":
        return true;
      case "admin":
        return false;
      default:
        return false;
    }
  }

  // Add auth state listener
  onAuthStateChanged(listener) {
    this.authStateListeners.add(listener);
    return () => {
      this.authStateListeners.delete(listener);
    };
  }

  // Cleanup
  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.authStateListeners.clear();
    this.currentUser = null;
    this.isInitialized = false;
  }
}

// Export singleton instance
export const authService = new AuthService();
export default AuthService;
