import { supabase } from "@/configs/supabase";
import { validators, validateSchema } from "./validation";
import { AppError, ValidationError } from "./error-handler";

class SupabaseService {
  constructor() {
    this.supabase = supabase;
  }

  // User operations
  async createUser(userData) {
    try {
      const validatedData = validateSchema(userData, {
        name: (value) => validators.string(value, "name", { maxLength: 100 }),
        email: (value) => validators.email(value, "email"),
        pictureURL: (value) =>
          validators.optional(validators.string)(value, "pictureURL"),
      });

      // Check if user already exists
      const { data: existingUser, error: fetchError } = await this.supabase
        .from("users")
        .select("*")
        .eq("email", validatedData.email)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw new AppError(
          `Failed to check existing user: ${fetchError.message}`,
          500
        );
      }

      if (existingUser) {
        return existingUser;
      }

      // Create new user
      const { data: newUser, error: insertError } = await this.supabase
        .from("users")
        .insert({
          name: validatedData.name || validatedData.email || "Unknown User",
          email: validatedData.email,
          picture_url: validatedData.pictureURL || "",
          credits: 10, // Give new users 10 credits
        })
        .select()
        .single();

      if (insertError) {
        throw new AppError(
          `Failed to create user: ${insertError.message}`,
          500
        );
      }

      // Convert snake_case to camelCase for frontend compatibility
      const convertedUser = {
        ...newUser,
        pictureURL: newUser.picture_url,
        createdAt: newUser.created_at,
        updatedAt: newUser.updated_at,
      };

      return convertedUser;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to create user: ${error.message}`, 500);
    }
  }

  async getUserByEmail(email) {
    try {
      const validatedEmail = validators.email(email, "email");

      const { data: user, error } = await this.supabase
        .from("users")
        .select("*")
        .eq("email", validatedEmail)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // User not found
        }
        throw new AppError(
          `Failed to get user by email: ${error.message}`,
          500
        );
      }

      if (!user) {
        return null;
      }

      // Convert snake_case to camelCase for frontend compatibility
      const convertedUser = {
        ...user,
        pictureURL: user.picture_url,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      };

      return convertedUser;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to get user: ${error.message}`, 500);
    }
  }

  async getUserById(userId) {
    try {
      const validatedId = validators.string(userId, "userId");

      const { data: user, error } = await this.supabase
        .from("users")
        .select("*")
        .eq("id", validatedId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // User not found
        }
        throw new AppError(`Failed to get user by ID: ${error.message}`, 500);
      }

      if (!user) {
        return null;
      }

      // Convert snake_case to camelCase for frontend compatibility
      const convertedUser = {
        ...user,
        pictureURL: user.picture_url,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      };

      return convertedUser;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to get user: ${error.message}`, 500);
    }
  }

  // Video operations
  async createVideo(videoData) {
    try {
      const validatedData = validateSchema(videoData, {
        title: (value) =>
          validators.string(value, "title", { required: true, maxLength: 200 }),
        topic: (value) =>
          validators.string(value, "topic", { required: true, maxLength: 200 }),
        script: (value) =>
          validators.string(value, "script", {
            required: true,
            maxLength: 5000,
          }),
        videoStyle: (value) =>
          validators.string(value, "videoStyle", {
            required: true,
            maxLength: 100,
          }),
        voice: (value) =>
          validators.string(value, "voice", { required: true, maxLength: 100 }),
        caption: (value) =>
          validators.object(value, "caption", {
            style: (v) =>
              validators.string(v, "caption.style", { maxLength: 100 }),
          }),
        userEmail: (value) => validators.email(value, "userEmail"),
        createdBy: (value) =>
          validators.optional(validators.string)(value, "createdBy"),
      });

      // First, find or create the user
      let user = await this.getUserByEmail(validatedData.userEmail);

      if (!user) {
        user = await this.createUser({
          name: validatedData.userEmail.split("@")[0],
          email: validatedData.userEmail,
          pictureURL: "",
        });
      }

      // Create the video record
      const { data: video, error } = await this.supabase
        .from("video_data")
        .insert({
          title: validatedData.title.trim(),
          topic: validatedData.topic.trim(),
          script: validatedData.script.trim(),
          video_style: validatedData.videoStyle.trim(),
          caption: validatedData.caption || {},
          voice: validatedData.voice.trim(),
          user_id: user.id,
          created_by: validatedData.createdBy || validatedData.userEmail,
          images: validatedData.images,
          audio_url: validatedData.audioURL,
          caption_json: validatedData.captionJson,
        })
        .select()
        .single();

      if (error) {
        throw new AppError(`Failed to create video: ${error.message}`, 500);
      }

      // Convert snake_case to camelCase for frontend compatibility
      const convertedVideo = {
        ...video,
        audioURL: video.audio_url,
        captionJson: video.caption_json,
        userId: video.user_id,
        createdAt: video.created_at,
        updatedAt: video.updated_at,
      };

      return convertedVideo;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to create video: ${error.message}`, 500);
    }
  }

  async updateVideo(videoId, updateData) {
    try {
      const validatedId = validators.string(videoId, "videoId");
      const validatedUpdate = validateSchema(updateData, {
        audioURL: (value) =>
          validators.optional(validators.string)(value, "audioURL"),
        images: (value) => validators.optional(validators.any)(value, "images"),
        captionJson: (value) =>
          validators.optional(validators.any)(value, "captionJson"),
      });

      const updateFields = {};
      if (validatedUpdate.audioURL !== undefined)
        updateFields.audio_url = validatedUpdate.audioURL;
      if (validatedUpdate.images !== undefined)
        updateFields.images = validatedUpdate.images;
      if (validatedUpdate.captionJson !== undefined)
        updateFields.caption_json = validatedUpdate.captionJson;

      if (Object.keys(updateFields).length === 0) {
        throw new AppError("No fields to update", 400);
      }

      const { data: video, error } = await this.supabase
        .from("video_data")
        .update(updateFields)
        .eq("id", validatedId)
        .select()
        .single();

      if (error) {
        throw new AppError(`Failed to update video: ${error.message}`, 500);
      }

      // Convert snake_case to camelCase for frontend compatibility
      const convertedVideo = {
        ...video,
        audioURL: video.audio_url,
        captionJson: video.caption_json,
        userId: video.user_id,
        createdAt: video.created_at,
        updatedAt: video.updated_at,
      };

      return convertedVideo;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to update video: ${error.message}`, 500);
    }
  }

  async getUserVideosByEmail(email) {
    try {
      const validatedEmail = validators.email(email, "email");

      // Use the database function to get videos by email
      const { data: videos, error } = await this.supabase.rpc(
        "get_videos_by_email",
        { user_email: validatedEmail }
      );

      if (error) {
        throw new AppError(
          `Failed to get user videos by email: ${error.message}`,
          500
        );
      }

      // Convert snake_case to camelCase for frontend compatibility
      const convertedVideos = (videos || []).map((video) => ({
        ...video,
        audioURL: video.audio_url,
        captionJson: video.caption_json,
        userId: video.user_id,
        createdAt: video.created_at,
        updatedAt: video.updated_at,
      }));

      return convertedVideos;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        `Failed to get user videos by email: ${error.message}`,
        500
      );
    }
  }

  async getUserVideos(userId) {
    try {
      const validatedId = validators.string(userId, "userId");

      // Check if this is a Firebase UID (typically 28 characters) or Supabase UUID (36 characters)
      if (validatedId.length === 28) {
        // This is a Firebase UID, we need to get the user by email first
        console.log(
          "Firebase UID detected, cannot fetch videos directly with UID"
        );

        // Provide a helpful error message
        throw new AppError(
          "Cannot fetch videos with Firebase UID. Please use getVideosByEmail() with the user's email address instead.",
          400
        );
      }

      // If it's a valid UUID (36 characters), proceed normally
      if (validatedId.length !== 36) {
        throw new AppError(
          `Invalid user ID format. Expected UUID (36 characters) but got ${validatedId.length} characters.`,
          400
        );
      }

      const { data: videos, error } = await this.supabase
        .from("video_data")
        .select("*")
        .eq("user_id", validatedId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new AppError(`Failed to get user videos: ${error.message}`, 500);
      }

      // Convert snake_case to camelCase for frontend compatibility
      const convertedVideos = (videos || []).map((video) => ({
        ...video,
        audioURL: video.audio_url,
        captionJson: video.caption_json,
        userId: video.user_id,
        createdAt: video.created_at,
        updatedAt: video.updated_at,
      }));

      return convertedVideos;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to get user videos: ${error.message}`, 500);
    }
  }

  async getVideosByEmail(email) {
    try {
      const validatedEmail = validators.email(email, "email");

      // First find the user
      const user = await this.getUserByEmail(validatedEmail);
      if (!user) {
        return [];
      }

      // Get user's videos
      const { data: videos, error } = await this.supabase
        .from("video_data")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw new AppError(
          `Failed to get videos by email: ${error.message}`,
          500
        );
      }

      // Convert snake_case to camelCase for frontend compatibility
      const convertedVideos = (videos || []).map((video) => ({
        ...video,
        audioURL: video.audio_url,
        captionJson: video.caption_json,
        userId: video.user_id,
        createdAt: video.created_at,
        updatedAt: video.updated_at,
      }));

      return convertedVideos;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        `Failed to get videos by email: ${error.message}`,
        500
      );
    }
  }

  async getVideoById(videoId) {
    try {
      const validatedId = validators.string(videoId, "videoId");

      const { data: video, error } = await this.supabase
        .from("video_data")
        .select("*")
        .eq("id", validatedId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // Video not found
        }
        throw new AppError(`Failed to get video: ${error.message}`, 500);
      }

      if (!video) {
        return null;
      }

      // Convert snake_case to camelCase for frontend compatibility
      const convertedVideo = {
        ...video,
        audioURL: video.audio_url,
        captionJson: video.caption_json,
        userId: video.user_id,
        createdAt: video.created_at,
        updatedAt: video.updated_at,
      };

      return convertedVideo;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to get video: ${error.message}`, 500);
    }
  }

  async deleteVideo(videoId, userId) {
    try {
      const validatedVideoId = validators.string(videoId, "videoId");
      const validatedUserId = validators.string(userId, "userId");

      // First verify the video belongs to the user
      const video = await this.getVideoById(validatedVideoId);
      if (!video) {
        throw new AppError("Video not found", 404);
      }

      if (video.user_id !== validatedUserId) {
        throw new AppError("Unauthorized to delete this video", 403);
      }

      const { error } = await this.supabase
        .from("video_data")
        .delete()
        .eq("id", validatedVideoId);

      if (error) {
        throw new AppError(`Failed to delete video: ${error.message}`, 500);
      }

      return { success: true };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to delete video: ${error.message}`, 500);
    }
  }

  // Utility methods
  async testConnection() {
    try {
      const { data: users, error: usersError } = await this.supabase
        .from("users")
        .select("count", { count: "exact", head: true });

      const { data: videos, error: videosError } = await this.supabase
        .from("video_data")
        .select("count", { count: "exact", head: true });

      if (usersError || videosError) {
        throw new AppError("Database connection test failed", 500);
      }

      return {
        success: true,
        userCount: users || 0,
        videoCount: videos || 0,
        message: "Database connection working!",
      };
    } catch (error) {
      throw new AppError(
        `Database connection test failed: ${error.message}`,
        500
      );
    }
  }

  async getAllUsers() {
    try {
      const { data: users, error } = await this.supabase
        .from("users")
        .select("*");

      if (error) {
        throw new AppError(`Failed to get all users: ${error.message}`, 500);
      }

      // Convert snake_case to camelCase for frontend compatibility
      const convertedUsers = (users || []).map((user) => ({
        ...user,
        pictureURL: user.picture_url,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      }));

      return convertedUsers;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to get users: ${error.message}`, 500);
    }
  }

  async getAllVideos() {
    try {
      const { data: videos, error } = await this.supabase
        .from("video_data")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw new AppError(`Failed to get all videos: ${error.message}`, 500);
      }

      // Convert snake_case to camelCase for frontend compatibility
      const convertedVideos = (videos || []).map((video) => ({
        ...video,
        audioURL: video.audio_url,
        captionJson: video.caption_json,
        userId: video.user_id,
        createdAt: video.created_at,
        updatedAt: video.updated_at,
      }));

      return convertedVideos;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to get videos: ${error.message}`, 500);
    }
  }

  async getDetailedAnalysis() {
    try {
      const { data: allVideos, error: videosError } = await this.supabase
        .from("video_data")
        .select("*");

      const { data: allUsers, error: usersError } = await this.supabase
        .from("users")
        .select("*");

      if (videosError || usersError) {
        throw new AppError("Failed to get data for analysis", 500);
      }

      const analysis = {
        totalVideos: allVideos?.length || 0,
        totalUsers: allUsers?.length || 0,
        videosWithValidUserId: 0,
        videosWithInvalidUserId: 0,
        orphanedVideos: 0,
        userEmails: allUsers?.map((u) => u.email) || [],
        videoTitles: allVideos?.map((v) => v.title) || [],
      };

      if (allVideos) {
        for (const video of allVideos) {
          if (video.user_id && typeof video.user_id === "string") {
            const user = allUsers?.find((u) => u.id === video.user_id);
            if (user) {
              analysis.videosWithValidUserId++;
            } else {
              analysis.orphanedVideos++;
            }
          } else {
            analysis.videosWithInvalidUserId++;
          }
        }
      }

      return analysis;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to get analysis: ${error.message}`, 500);
    }
  }
}

// Export singleton instance
export const supabaseService = new SupabaseService();
export default SupabaseService;
