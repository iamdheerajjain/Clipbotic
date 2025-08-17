"use client";
import React, { useState, useEffect } from "react";
import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/use-supabase";
import { supabaseService } from "@/lib/supabase-service";
import { useAuthContext } from "@/app/providers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/ui/section-header";
import StatCard from "@/components/ui/stat-card";
import Badge from "@/components/ui/badge";
import {
  Play,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Trash2,
  AlertTriangle,
  Video,
} from "lucide-react";
import Link from "next/link";

function DashboardOverview() {
  const { user } = useAuthContext();
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Get videos for the current user
  const {
    data: videos,
    loading,
    error,
  } = useSupabaseQuery(
    () => supabaseService.getUserVideos(user?._id),
    [user?._id]
  );

  // Delete mutation
  const deleteVideo = useSupabaseMutation(
    supabaseService.deleteVideoData.bind(supabaseService),
    {
      onSuccess: () => {
        // Invalidate and refetch videos after successful deletion
        window.location.reload();
      },
      onError: (error) => {
        console.error("Delete video error:", error);
        alert("Failed to delete video. Please try again.");
      },
    }
  );

  if (!user) {
    return null;
  }

  // Ensure videos is always an array
  const videosArray = Array.isArray(videos) ? videos : [];

  // Helper function to calculate video duration
  const calculateVideoDuration = (video) => {
    // Method 1: Calculate based on script length
    if (video.script) {
      const wordCount = video.script.split(/\s+/).length;
      const estimatedDurationSeconds = Math.max(10, wordCount / 2.5); // 2.5 words per second
      return Math.ceil(estimatedDurationSeconds);
    }

    // Method 2: Use caption timing if available
    if (video.caption_json || video.captionJson) {
      try {
        const captions =
          typeof (video.caption_json || video.captionJson) === "string"
            ? JSON.parse(video.caption_json || video.captionJson)
            : video.caption_json || video.captionJson;

        if (Array.isArray(captions) && captions.length > 0) {
          const lastCaption = captions[captions.length - 1];
          return Math.ceil(lastCaption.end || 0);
        }
      } catch (error) {
        console.warn("Failed to parse captions for duration:", error);
      }
    }

    // Method 3: Use image count as fallback
    if (video.images && Array.isArray(video.images)) {
      return video.images.length * 3; // 3 seconds per image
    }

    return 10; // Default 10 seconds
  };

  // Helper function to format duration
  const formatDuration = (seconds) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Helper function to get video style
  const getVideoStyle = (video) => {
    return video.video_style || video.videoStyle || "Unknown";
  };

  // Helper function to check if video is complete
  const isVideoComplete = (video) => {
    const hasAudio = video.audio_url || video.audioURL;
    const hasCaptions = video.caption_json || video.captionJson;
    const hasImages =
      video.images && Array.isArray(video.images) && video.images.length > 0;
    return hasAudio || hasCaptions;
  };

  const completedVideos = videosArray.filter(isVideoComplete);
  const processingVideos = videosArray.filter(
    (video) => !isVideoComplete(video)
  );
  const recentVideos = videosArray.slice(0, 3);

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-8">
        <SectionHeader
          title="Dashboard"
          subtitle="Track your creations and manage your video projects"
        />
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading, please wait.</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-8">
        <SectionHeader
          title="Dashboard"
          subtitle="Track your creations and manage your video projects"
        />
        <div className="text-center py-8">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-500">Error loading videos: {error.message}</p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-2"
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleDeleteClick = (video) => {
    setDeleteConfirm(video);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm || !user) return;

    console.log("Deleting video:", {
      videoId: deleteConfirm.id,
      userId: user._id || user.supabaseId,
      user: user,
    });

    try {
      await deleteVideo.mutate({
        videoId: deleteConfirm.id,
        userId: user._id || user.supabaseId,
      });
      setDeleteConfirm(null);
      // Data will be automatically refetched by the query
    } catch (error) {
      console.error("Error deleting video:", error);
      alert("Failed to delete video. Please try again.");
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Dashboard"
        subtitle="Track your creations and manage your video projects"
        actions={
          <Button asChild>
            <Link href="/dashboard/create">Create New Video</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Videos" value={videosArray.length} icon={Play} />
        <StatCard
          title="Completed"
          value={completedVideos.length}
          icon={CheckCircle}
          tone="success"
        />
        <StatCard
          title="Processing"
          value={processingVideos.length}
          icon={Clock}
          tone="warning"
        />
      </div>

      {/* Recent Videos */}
      {recentVideos.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Videos</CardTitle>
                <CardDescription>Your latest video creations</CardDescription>
              </div>
              <Button
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-black font-semibold py-2 px-4 rounded-xl shadow-[0_8px_30px_rgba(124,58,237,0.3)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.4)] transition-all duration-300"
                asChild
              >
                <Link href="/dashboard/videos">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentVideos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium line-clamp-1">
                      {video.title || "Untitled Video"}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{video.topic}</span>
                      <span>•</span>
                      <span>{getVideoStyle(video)}</span>
                      <span>•</span>
                      <span>
                        {formatDuration(calculateVideoDuration(video))}
                      </span>
                      <span>•</span>
                      <span>{formatTimeAgo(video.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isVideoComplete(video) ? (
                      <Badge variant="success" className="gap-1.5">
                        <CheckCircle className="w-3 h-3" /> Complete
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="gap-1.5">
                        <Clock className="w-3 h-3" /> Processing
                      </Badge>
                    )}
                    {isVideoComplete(video) && (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/videos/play/${video.id}`}>
                          <Play className="w-3 h-3" />
                        </Link>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteClick(video)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-6 h-6 text-rose-400" />
              <h3 className="text-lg font-semibold">Confirm Deletion</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Are you sure you want to delete "
              {deleteConfirm.title || "Untitled Video"}"? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleDeleteCancel}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardOverview;
