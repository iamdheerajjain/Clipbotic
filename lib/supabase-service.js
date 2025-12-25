import { supabase } from "@/configs/supabaseconfig";

export class SupabaseService {
  // ===== TESTING & DEBUGGING =====

  async testDatabaseConnection() {
    try {
      console.log("=== Testing Supabase Connection ===");

      // Test basic connection
      const { data: connectionTest, error: connectionError } = await supabase
        .from("users")
        .select("count")
        .limit(1);

      if (connectionError) {
        console.error("Connection test failed:", connectionError);
        return {
          success: false,
          error: connectionError,
          message: "Failed to connect to Supabase or tables don't exist",
        };
      }

      console.log("Connection test successful");
      return {
        success: true,
        message: "Supabase connection working",
      };
    } catch (error) {
      console.error("Test connection error:", error);
      return {
        success: false,
        error: error,
        message: "Connection test failed",
      };
    }
  }

  async checkTablesExist() {
    try {
      console.log("=== Checking if tables exist ===");

      // Try to query users table
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*")
        .limit(1);

      if (usersError) {
        console.error("Users table error:", usersError);
        return {
          usersTable: false,
          usersError: usersError,
        };
      }

      // Try to query video_data table
      const { data: videosData, error: videosError } = await supabase
        .from("video_data")
        .select("*")
        .limit(1);

      if (videosError) {
        console.error("Video_data table error:", videosError);
        return {
          usersTable: true,
          videoDataTable: false,
          videosError: videosError,
        };
      }

      return {
        usersTable: true,
        videoDataTable: true,
        message: "All tables exist",
      };
    } catch (error) {
      console.error("Check tables error:", error);
      return {
        error: error,
        message: "Failed to check tables",
      };
    }
  }

  // ===== USER OPERATIONS =====

  async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("GetAllUsers error:", error);
      throw error;
    }
  }

  async createNewUser({ name, email, pictureURL }) {
    try {
      console.log("=== CreateNewUser START ===");
      console.log("Creating user with email:", email);

      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existingUser) {
        console.log("User already exists:", existingUser.id);
        console.log("=== CreateNewUser SUCCESS (existing) ===");
        return existingUser.id;
      }

      // Create new user
      const userData = {
        name: name || email || "Unknown User",
        email: email,
        picture_url: pictureURL || "",
        credits: 10, // Give new users 10 credits
      };

      console.log("Inserting new user with data:", userData);
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert(userData)
        .select()
        .single();

      if (insertError) throw insertError;

      console.log("New user created with ID:", newUser.id);
      console.log("=== CreateNewUser SUCCESS (new) ===");
      return newUser.id;
    } catch (error) {
      console.error("CreateNewUser error:", error);
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows gracefully

      if (error) throw error;
      return data; // Returns null if no user found, or the user data if found
    } catch (error) {
      console.error("GetUserById error:", error);
      throw error;
    }
  }

  async getUserByEmail(email) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows gracefully

      if (error) throw error;
      return data; // Returns null if no user found, or the user data if found
    } catch (error) {
      console.error("GetUserByEmail error:", error);
      throw error;
    }
  }

  async getUserIdByEmail(email) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows gracefully

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error("GetUserIdByEmail error:", error);
      return null;
    }
  }

  // ===== VIDEO OPERATIONS =====

  async createVideoData({
    title,
    topic,
    script,
    videoStyle,
    caption,
    voice,
    userEmail,
    createdBy,
    images,
    audioURL,
    captionJson,
  }) {
    try {
      console.log("=== CreateVideoData START ===");
      console.log("Creating video for user email:", userEmail);

      // First, find or create the user
      let user = await this.getUserByEmail(userEmail);

      if (!user) {
        console.log("User not found, creating new user...");
        const userId = await this.createNewUser({
          name: userEmail.split("@")[0],
          email: userEmail,
          pictureURL: "",
        });
        user = await this.getUserById(userId);
        console.log("New user created:", user.id);
      } else {
        console.log("Found existing user:", user.id);
      }

      // Validate required fields
      if (!title || !topic || !script || !videoStyle || !voice) {
        throw new Error(
          "Missing required fields: title, topic, script, videoStyle, or voice"
        );
      }

      // Create the video record
      const videoData = {
        title: title.trim(),
        topic: topic.trim(),
        script: script.trim(),
        video_style: videoStyle.trim(),
        caption: caption || {},
        voice: voice.trim(),
        uid: user.id,
        created_by: createdBy || userEmail,
        images: images,
        audio_url: audioURL,
        caption_json: captionJson,
      };

      console.log("Inserting video data with user ID:", user.id);
      const { data: newVideo, error: insertError } = await supabase
        .from("video_data")
        .insert(videoData)
        .select()
        .single();

      if (insertError) throw insertError;

      console.log("Video data created successfully with ID:", newVideo.id);
      console.log("=== CreateVideoData SUCCESS ===");
      return newVideo.id;
    } catch (error) {
      console.error("CreateVideoData error:", error);
      throw error;
    }
  }

  async createVideoDataWithUID({
    title,
    topic,
    script,
    videoStyle,
    caption,
    voice,
    uid,
    createdBy,
    images,
    audioURL,
    captionJson,
  }) {
    try {
      console.log("=== CreateVideoDataWithUID START ===");
      console.log("Creating video for user ID:", uid);

      // Verify user exists
      const user = await this.getUserById(uid);
      if (!user) {
        throw new Error(`User with ID ${uid} not found`);
      }

      // Validate required fields
      if (!title || !topic || !script || !videoStyle || !voice) {
        throw new Error("Missing required fields");
      }

      const videoData = {
        title: title.trim(),
        topic: topic.trim(),
        script: script.trim(),
        video_style: videoStyle.trim(),
        caption: caption || {},
        voice: voice.trim(),
        uid: uid,
        created_by: createdBy.trim(),
        images: images,
        audio_url: audioURL,
        caption_json: captionJson,
      };

      const { data: newVideo, error: insertError } = await supabase
        .from("video_data")
        .insert(videoData)
        .select()
        .single();

      if (insertError) throw insertError;

      console.log("Video created with ID:", newVideo.id);
      console.log("=== CreateVideoDataWithUID SUCCESS ===");
      return newVideo.id;
    } catch (error) {
      console.error("CreateVideoDataWithUID error:", error);
      throw error;
    }
  }

  async updateVideoData({ videoRecordId, audioURL, images, captionJson }) {
    try {
      console.log("UpdateVideoData called with args:", {
        videoRecordId,
        audioURL: audioURL ? `${audioURL.substring(0, 50)}...` : 'undefined',
        imagesCount: Array.isArray(images) ? images.length : typeof images,
        captionsCount: Array.isArray(captionJson) ? captionJson.length : typeof captionJson
      });

      // Verify video exists
      const video = await this.getVideoById(videoRecordId);
      if (!video) {
        throw new Error("Video not found");
      }

      // Build update data
      const updateData = {};
      if (audioURL !== undefined) updateData.audio_url = audioURL;
      if (images !== undefined) {
        // Ensure images is stored as JSON
        updateData.images = Array.isArray(images) ? images : images;
      }
      if (captionJson !== undefined) {
        // Ensure captions is stored as JSON
        updateData.caption_json = Array.isArray(captionJson) ? captionJson : captionJson;
      }

      if (Object.keys(updateData).length === 0) {
        throw new Error("No fields to update");
      }

      console.log("Updating video with data:", {
        videoRecordId,
        updateFields: Object.keys(updateData),
        audioUrlExists: !!updateData.audio_url,
        imagesCount: Array.isArray(updateData.images) ? updateData.images.length : 'not array',
        captionsCount: Array.isArray(updateData.caption_json) ? updateData.caption_json.length : 'not array'
      });

      const { data: updatedVideo, error: updateError } = await supabase
        .from("video_data")
        .update(updateData)
        .eq("id", videoRecordId)
        .select()
        .single();

      if (updateError) {
        console.error("Supabase update error:", updateError);
        throw updateError;
      }

      console.log("Video updated successfully:", updatedVideo.id);
      return updatedVideo;
    } catch (error) {
      console.error("UpdateVideoData error:", error);
      throw error;
    }
  }

  async getAllVideos() {
    try {
      const { data, error } = await supabase
        .from("video_data")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      console.log("GetAllVideos found:", data.length, "videos");
      return data || [];
    } catch (error) {
      console.error("GetAllVideos error:", error);
      throw error;
    }
  }

  async getVideosByEmail(email) {
    try {
      console.log("GetVideosByEmail for:", email);

      // First find the user
      const user = await this.getUserByEmail(email);

      if (!user) {
        console.log("User not found for email:", email);
        return [];
      }

      // Get user's videos
      const { data: videos, error } = await supabase
        .from("video_data")
        .select("*")
        .eq("uid", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log("Found", videos.length, "videos for user");
      return videos || [];
    } catch (error) {
      console.error("GetVideosByEmail error:", error);
      return [];
    }
  }

  async getUserVideos(userId) {
    try {
      console.log("GetUserVideos for userId:", userId);

      // Verify user exists
      const user = await this.getUserById(userId);
      if (!user) {
        console.log("User not found");
        return [];
      }

      const { data: userVideos, error } = await supabase
        .from("video_data")
        .select("*")
        .eq("uid", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log("Found", userVideos.length, "videos for user");
      return userVideos || [];
    } catch (error) {
      console.error("GetUserVideos error:", error);
      return [];
    }
  }

  async getVideoById(videoId) {
    try {
      console.log("GetVideoById called with videoId:", videoId);
      console.log("VideoId type:", typeof videoId);
      console.log("VideoId length:", videoId?.length);

      if (!videoId) {
        throw new Error("Video ID is required");
      }

      // Check if videoId looks like a valid UUID
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(videoId)) {
        console.warn("Video ID doesn't match UUID format:", videoId);
        console.warn("Expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx");
      }

      // Test Supabase connection first
      console.log("Testing Supabase connection...");
      const { data: connectionTest, error: connectionError } = await supabase
        .from("video_data")
        .select("count")
        .limit(1);

      if (connectionError) {
        console.error("Connection test failed:", connectionError);
        throw new Error(
          `Supabase connection failed: ${connectionError.message}`
        );
      }

      console.log("Connection test successful");
      console.log("Connection test result:", connectionTest);

      // Test if we can get any videos at all
      console.log("Testing if we can get any videos...");
      const { data: allVideos, error: allVideosError } = await supabase
        .from("video_data")
        .select("id, title")
        .limit(5);

      if (allVideosError) {
        console.error("All videos test failed:", allVideosError);
        throw new Error(
          `Cannot query video_data table: ${allVideosError.message}`
        );
      }

      console.log(
        "All videos test successful, found:",
        allVideos?.length || 0,
        "videos"
      );
      console.log("Sample video IDs:", allVideos?.map((v) => v.id) || []);

      // Build the query
      const query = supabase.from("video_data").select("*").eq("id", videoId);

      console.log("Executing query for video ID:", videoId);
      const { data, error } = await query.maybeSingle();

      console.log("Query result:", { data, error });

      if (error) {
        console.error("Supabase query error:", error);
        console.error("Error object keys:", Object.keys(error));
        console.error("Error object values:", Object.values(error));
        throw error;
      }

      if (!data) {
        console.log("Video not found for ID:", videoId);
        return null;
      }

      console.log("Video found:", data);
      return data;
    } catch (error) {
      console.error("GetVideoById error:", error);
      console.error("Error type:", typeof error);
      console.error("Error constructor:", error.constructor.name);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stack: error.stack,
      });
      throw error;
    }
  }

  async getVideoCount() {
    try {
      const { count, error } = await supabase
        .from("video_data")
        .select("*", { count: "exact", head: true });

      if (error) throw error;

      return {
        count: count || 0,
        success: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("GetVideoCount error:", error);
      return {
        count: 0,
        success: false,
        error: error.message,
      };
    }
  }

  async deleteVideoData({ videoId, userId }) {
    try {
      console.log("DeleteVideoData called with:", { videoId, userId });

      const video = await this.getVideoById(videoId);
      if (!video) {
        throw new Error("Video not found");
      }

      if (video.uid !== userId) {
        throw new Error(
          `Unauthorized to delete this video. Video UID: ${video.uid}, User ID: ${userId}`
        );
      }

      const { error } = await supabase
        .from("video_data")
        .delete()
        .eq("id", videoId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // ===== TESTING FUNCTIONS =====

  async createSimpleTestVideo({ email }) {
    try {
      console.log("=== CreateSimpleTestVideo START ===");

      // Find or create user
      let user = await this.getUserByEmail(email);

      if (!user) {
        const userId = await this.createNewUser({
          name: email.split("@")[0],
          email: email,
          pictureURL: "",
        });
        user = await this.getUserById(userId);
        console.log("Created new user:", user.id);
      }

      // Create test video
      const videoData = {
        title: "Test Video - " + new Date().toLocaleTimeString(),
        topic: "Test Topic",
        script:
          "This is a test script to verify the video creation is working properly.",
        video_style: "Realistic",
        caption: { style: "YouTuber" },
        voice: "hf_alpha",
        uid: user.id,
        created_by: email,
      };

      const videoId = await this.createVideoDataWithUID({
        ...videoData,
        uid: user.id,
        createdBy: email,
      });

      const createdVideo = await this.getVideoById(videoId);

      // Get total count
      const allVideos = await this.getAllVideos();

      console.log("=== CreateSimpleTestVideo SUCCESS ===");
      return {
        success: true,
        videoId: videoId,
        video: createdVideo,
        totalVideos: allVideos.length,
        message: "Test video created successfully!",
      };
    } catch (error) {
      console.error("CreateSimpleTestVideo error:", error);
      throw error;
    }
  }

  async getDetailedAnalysis() {
    try {
      const allVideos = await this.getAllVideos();
      const allUsers = await this.getAllUsers();

      const analysis = {
        totalVideos: allVideos.length,
        totalUsers: allUsers.length,
        videosWithValidUid: 0,
        videosWithInvalidUid: 0,
        orphanedVideos: 0,
        userEmails: allUsers.map((u) => u.email),
        videoTitles: allVideos.map((v) => v.title),
      };

      for (const video of allVideos) {
        if (
          video.uid &&
          typeof video.uid === "string" &&
          video.uid.length > 10
        ) {
          // Check if user exists
          const user = await this.getUserById(video.uid);
          if (user) {
            analysis.videosWithValidUid++;
          } else {
            analysis.orphanedVideos++;
          }
        } else {
          analysis.videosWithInvalidUid++;
        }
      }

      return analysis;
    } catch (error) {
      console.error("GetDetailedAnalysis error:", error);
      throw error;
    }
  }

  // Emergency function to fix user-video relationships
  async fixUserVideoRelationships({ email }) {
    try {
      console.log("=== FixUserVideoRelationships START ===");

      // Find or create user
      let user = await this.getUserByEmail(email);

      if (!user) {
        const userId = await this.createNewUser({
          name: email.split("@")[0],
          email: email,
          pictureURL: "",
        });
        user = await this.getUserById(userId);
        console.log("Created new user:", user.id);
      }

      // Find all videos that might belong to this user
      const allVideos = await this.getAllVideos();
      const videosToFix = allVideos.filter(
        (video) =>
          video.created_by === email ||
          (typeof video.uid === "string" && video.uid === email)
      );

      console.log("Found", videosToFix.length, "videos to fix");

      // Fix each video
      const fixedVideos = [];
      for (const video of videosToFix) {
        if (video.uid !== user.id) {
          const { error } = await supabase
            .from("video_data")
            .update({ uid: user.id })
            .eq("id", video.id);

          if (!error) {
            fixedVideos.push({
              id: video.id,
              title: video.title,
              oldUid: video.uid,
              newUid: user.id,
            });
          }
        }
      }

      console.log("=== FixUserVideoRelationships SUCCESS ===");
      return {
        success: true,
        user: { id: user.id, email: user.email },
        videosFixed: fixedVideos.length,
        fixedVideos: fixedVideos,
      };
    } catch (error) {
      console.error("FixUserVideoRelationships error:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const supabaseService = new SupabaseService();
