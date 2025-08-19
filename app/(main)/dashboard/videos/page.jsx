"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/use-supabase";
import { usePerformance } from "@/hooks/use-performance";
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
import Badge from "@/components/ui/badge";
import {
  Play,
  Trash2,
  Clock,
  User,
  AlertTriangle,
  Search,
  Filter,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Input } from "@/components/ui/input";

// Memoized Video Card Component
const VideoCard = React.memo(({ video, onDeleteClick, isPlayable }) => {
  const { measureSync } = usePerformance(`VideoCard-${video.id}`);

  const thumb = useMemo(() => {
    return measureSync("thumbnail-generation", () => {
      try {
        let imgs = video?.images;
        if (!imgs) return null;
        if (typeof imgs === "string") imgs = JSON.parse(imgs);
        if (Array.isArray(imgs) && imgs.length > 0) {
          if (typeof imgs[0] === "string") return imgs[0];
          if (typeof imgs[0] === "object") {
            return (
              imgs[0]?.image ||
              imgs[0]?.url ||
              imgs[0]?.imageUrl ||
              imgs[0]?.imageURL ||
              null
            );
          }
        }
        return null;
      } catch (e) {
        return null;
      }
    });
  }, [video.images, measureSync]);

  const images = useMemo(() => {
    return measureSync("images-parsing", () => {
      try {
        if (!video.images) return [];
        if (Array.isArray(video.images)) return video.images;
        if (typeof video.images === "string") return JSON.parse(video.images);
        return [];
      } catch (error) {
        return [];
      }
    });
  }, [video.images, measureSync]);

  const duration = useMemo(() => {
    return measureSync("duration-calculation", () => {
      if (video.script) {
        const wordCount = video.script.split(/\s+/).length;
        const estimatedDurationSeconds = Math.max(10, wordCount / 2.5);
        return Math.ceil(estimatedDurationSeconds);
      }
      if (video.caption_json) {
        try {
          const captions =
            typeof video.caption_json === "string"
              ? JSON.parse(video.caption_json)
              : video.caption_json;
          if (Array.isArray(captions) && captions.length > 0) {
            const lastCaption = captions[captions.length - 1];
            return Math.ceil(lastCaption.end || 0);
          }
        } catch (error) {
          console.warn("Failed to parse captions for duration:", error);
        }
      }
      if (images.length > 0) {
        return images.length * 3;
      }
      return 10;
    });
  }, [video.script, video.caption_json, images, measureSync]);

  const formatDuration = useCallback((seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }, []);

  const getStatusBadge = useMemo(() => {
    return measureSync("status-badge-generation", () => {
      const hasAudio = video.audio_url;
      const hasCaptions = video.caption_json;
      const hasImages = images.length > 0;

      if (hasImages && (hasAudio || hasCaptions)) {
        return <Badge variant="success">Ready</Badge>;
      } else if (hasImages && !hasAudio && !hasCaptions) {
        return <Badge variant="warning">Generating Audio</Badge>;
      } else if (!hasImages) {
        return <Badge variant="warning">Generating Images</Badge>;
      }
      return <Badge variant="warning">Processing</Badge>;
    });
  }, [images.length, video.audio_url, video.caption_json, measureSync]);

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      {thumb ? (
        <div className="relative w-full h-56 border-b border-border overflow-hidden flex-shrink-0">
          <img
            src={thumb}
            alt={video.title || "Video thumbnail"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="relative w-full h-56 border-b border-border overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No Preview</p>
          </div>
        </div>
      )}
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm line-clamp-2">
              {video.title || "Untitled Video"}
            </CardTitle>
            <CardDescription className="line-clamp-1 text-xs">
              {video.topic}
            </CardDescription>
          </div>
          {getStatusBadge}
        </div>
      </CardHeader>

      <CardContent className="space-y-2.5 flex-1 flex flex-col justify-end">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="inline-flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{formatDuration(duration)}</span>
          </div>
          <div className="truncate">
            <span className="opacity-70">Style:</span>{" "}
            {video.video_style || "Unknown"}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          {isPlayable ? (
            <>
              <Button size="sm" className="flex-1" asChild>
                <Link href={`/dashboard/videos/play/${video.id}`}>
                  <Play className="w-4 h-4 mr-2" />
                  Play
                </Link>
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={() => onDeleteClick(video)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="destructive"
              className="w-full"
              onClick={() => onDeleteClick(video)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

VideoCard.displayName = "VideoCard";

function VideosPage() {
  const { measureAsync, measureSync } = usePerformance("VideosPage");
  const { user } = useAuthContext();
  const [userVideos, setUserVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [styleFilter, setStyleFilter] = useState("all");

  // Get videos for the current user
  const {
    data: videos,
    loading: videosLoading,
    error,
  } = useSupabaseQuery(
    () => (user?._id ? supabaseService.getUserVideos(user._id) : []),
    [user?._id],
    {
      cacheTime: 2 * 60 * 1000, // 2 minutes
      staleTime: 1 * 60 * 1000, // 1 minute
    }
  );

  // Delete mutation
  const deleteVideo = useSupabaseMutation(
    supabaseService.deleteVideoData.bind(supabaseService),
    {
      onSuccess: () => {
        // Invalidate and refetch videos after successful deletion
        // The query will automatically refetch, no need for page reload
      },
      onError: (error) => {
        alert("Failed to delete video. Please try again.");
      },
    }
  );

  // Memoized video processing
  const processedVideos = useMemo(() => {
    return measureSync("video-processing", () => {
      if (!Array.isArray(videos)) return [];

      return videos.map((video) => {
        const images = Array.isArray(video.images)
          ? video.images
          : typeof video.images === "string"
          ? JSON.parse(video.images)
          : [];
        const hasAudio = video.audio_url;
        const hasCaptions = video.caption_json;
        const hasImages = images.length > 0;
        const isPlayable = hasImages && (hasAudio || hasCaptions);

        return {
          ...video,
          isPlayable,
          processedImages: images,
        };
      });
    });
  }, [videos, measureSync]);

  // Filtered videos based on search and filters
  const filteredVideos = useMemo(() => {
    return processedVideos.filter((video) => {
      // Search filter
      const matchesSearch =
        searchTerm === "" ||
        video.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.script?.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "ready" && video.isPlayable) ||
        (statusFilter === "processing" && !video.isPlayable);

      // Style filter
      const matchesStyle =
        styleFilter === "all" || video.video_style === styleFilter;

      return matchesSearch && matchesStatus && matchesStyle;
    });
  }, [processedVideos, searchTerm, statusFilter, styleFilter]);

  useEffect(() => {
    if (videos !== undefined) {
      setUserVideos(processedVideos);
      setLoading(false);
    }
  }, [processedVideos]);

  const handleDeleteClick = useCallback((video) => {
    setDeleteConfirm(video);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm || !user) return;

    try {
      await measureAsync("video-deletion", () =>
        deleteVideo.mutate({
          videoId: deleteConfirm.id,
          userId: user._id || user.supabaseId,
        })
      );
      setDeleteConfirm(null);
    } catch (error) {
      alert("Failed to delete video. Please try again.");
    }
  }, [deleteConfirm, user, deleteVideo, measureAsync]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirm(null);
  }, []);

  if (loading || videosLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-4">
          Please log in to view your videos
        </h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <h2 className="text-2xl font-bold mb-4 text-red-500">
          Error loading videos
        </h2>
        <p className="text-red-500 mb-4">{error.message}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <SectionHeader
        title="My Videos"
        subtitle="Manage and view all your generated videos"
        actions={
          <Button
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-black font-semibold px-4 py-3 rounded-xl shadow-[0_8px_30px_rgba(124,58,237,0.3)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.4)] transition-all duration-300"
            asChild
          >
            <Link href="/dashboard/create">Create New Video</Link>
          </Button>
        }
      />

      <div className="no-hover-glow">
        {/* Search and Filters */}
        <div className="mt-8 mb-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search videos by title, topic, or script..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="all">All Status</option>
                <option value="ready">Ready</option>
                <option value="processing">Processing</option>
              </select>
              <select
                value={styleFilter}
                onChange={(e) => setStyleFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="all">All Styles</option>
                <option value="Realistic">Realistic</option>
                <option value="Cinematic">Cinematic</option>
                <option value="Anime">Anime</option>
                <option value="Watercolor">Watercolor</option>
                <option value="Cyberpunk">Cyberpunk</option>
                <option value="GTA">GTA</option>
              </select>
            </div>
          </div>
          {searchTerm || statusFilter !== "all" || styleFilter !== "all" ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span>
                Showing {filteredVideos.length} of {userVideos.length} videos
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setStyleFilter("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : null}
        </div>

        <div className="mt-8">
          {filteredVideos.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-4 border border-border">
                <Play className="w-12 h-12 text-[--brand-from]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No videos yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first video to get started
              </p>
              <Button asChild>
                <Link href="/dashboard/create">Create New Video</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((video, index) => (
                <div
                  key={video.id || `video-${video.title}`}
                  className="h-full"
                >
                  <VideoCard
                    video={video}
                    onDeleteClick={handleDeleteClick}
                    isPlayable={video.isPlayable}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
                <h3 className="text-lg font-semibold">Confirm Deletion</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                Are you sure you want to delete "
                {deleteConfirm.title || "Untitled Video"}"? This action cannot
                be undone.
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
    </div>
  );
}

export default React.memo(VideosPage);
