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

  // Initialize authentication service
  async initialize() {
    if (this.isInitialized) return;

    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            // Get or create Supabase user
            const supabaseUser = await this.getOrCreateSupabaseUser(
              firebaseUser
            );
            this.currentUser = {
              ...firebaseUser,
              _id: supabaseUser.id,
              supabaseId: supabaseUser.id,
            };
          } else {
            this.currentUser = null;
          }

          // Notify all listeners
          this.authStateListeners.forEach((listener) => {
            try {
              listener(this.currentUser);
            } catch (error) {
              // Silent error handling for auth listeners
            }
          });

          if (!this.isInitialized) {
            this.isInitialized = true;
            resolve();
          }
        } catch (error) {
          this.currentUser = null;

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

  // Get or create Supabase user
  async getOrCreateSupabaseUser(firebaseUser) {
    try {
      // Try to get existing user
      let supabaseUser = await supabaseService.getUserByEmail(
        firebaseUser.email
      );

      if (!supabaseUser) {
        // Create new user if doesn't exist
        const userId = await supabaseService.createNewUser({
          name:
            firebaseUser.displayName ||
            firebaseUser.email?.split("@")[0] ||
            "Unknown User",
          email: firebaseUser.email,
          pictureURL: firebaseUser.photoURL || "",
        });

        supabaseUser = await supabaseService.getUserById(userId);
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

      // The auth state change listener will handle setting the user
      // and resetting the signing in state
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

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentUser;
  }

  // Check if user has specific permission
  hasPermission(permission) {
    if (!this.currentUser) return false;

    // Add permission logic here based on user role/credits
    switch (permission) {
      case "create_video":
        return true; // All authenticated users can create videos
      case "delete_video":
        return true; // Users can delete their own videos
      case "admin":
        return false; // No admin users for now
      default:
        return false;
    }
  }

  // Add auth state listener
  onAuthStateChanged(listener) {
    this.authStateListeners.add(listener);

    // Return unsubscribe function
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
