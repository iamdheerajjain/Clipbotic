"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  useGetUserVideos,
  useDeleteVideo,
  getCachedUserVideos,
} from "@/hooks/use-supabase";
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
import { Play, Trash2, Clock, User, AlertTriangle } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

function VideosPage() {
  const { user } = useAuthContext();
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [immediateVideos, setImmediateVideos] = useState(null);

  // Allow Firebase UIDs as temporary IDs for immediate functionality
  const userId = user?.supabaseId || user?.uid;
  const videos = useGetUserVideos(userId);

  // Delete mutation
  const [deleteVideo, { loading: deleteLoading }] = useDeleteVideo();

  // Check for cached data immediately on mount
  useEffect(() => {
    if (userId) {
      const cachedVideos = getCachedUserVideos(userId);
      if (cachedVideos) {
        setImmediateVideos(cachedVideos);
        console.log("Using cached videos for instant display");
      }
    }
  }, [userId]);

  // Update immediate videos when fresh data arrives
  useEffect(() => {
    if (videos && videos !== immediateVideos) {
      setImmediateVideos(videos);
    }
  }, [videos, immediateVideos]);

  // Use immediate videos if available, otherwise use fetched videos
  const displayVideos = immediateVideos || videos;

  // Check if we're still loading (videos is null means loading, empty array means no videos)
  const isLoading = videos === null && !immediateVideos;
  const hasVideos = displayVideos && displayVideos.length > 0;

  // Show loading state while fetching videos
  if (isLoading) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="My Videos"
          subtitle="Manage and organize your video projects"
          actions={
            <Button asChild>
              <Link href="/dashboard/create">Create New Video</Link>
            </Button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-secondary rounded-lg overflow-hidden">
                <div className="w-full h-56 bg-muted animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                  <div className="flex gap-2 pt-2">
                    <div className="h-8 bg-muted rounded flex-1 animate-pulse" />
                    <div className="h-8 bg-muted rounded flex-1 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
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

  const handleDeleteClick = (video) => {
    setDeleteConfirm(video);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm || !user || !userId) return;

    try {
      await deleteVideo(deleteConfirm.id, userId);
      setDeleteConfirm(null);
      // Optimistically remove from local state for instant UI feedback
      setImmediateVideos((prev) =>
        Array.isArray(prev)
          ? prev.filter((v) => v.id !== deleteConfirm.id)
          : prev
      );
    } catch (error) {
      console.error("Error deleting video:", error);
      alert("Failed to delete video. Please try again.");
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const getStatusBadge = (video) => {
    if (video.audio_url) {
      return <Badge variant="success">Complete</Badge>;
    }
    return <Badge variant="warning">Processing</Badge>;
  };

  const getThumbnail = (video) => {
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
  };

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="My Videos"
        subtitle="Manage and view all your generated videos"
        actions={
          <Button asChild>
            <Link href="/dashboard/create">Create New Video</Link>
          </Button>
        }
      />

      <div className="mt-6">
        {!hasVideos ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-4 border border-border">
              <Play className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No videos yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Start creating your first video by clicking the button above. Your
              videos will appear here once they're created.
            </p>
            <Button asChild>
              <Link href="/dashboard/create">Create New Video</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {displayVideos.map((video) => {
              const thumb = getThumbnail(video);
              return (
                <Card key={video.id} className="overflow-hidden">
                  {thumb ? (
                    <div className="relative w-full h-56 border-b border-border overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumb}
                        alt={video.title || "Video thumbnail"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : null}
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm line-clamp-2">
                          {video.title || "Untitled Video"}
                        </CardTitle>
                        <CardDescription className="line-clamp-1 text-xs">
                          {video.topic}
                        </CardDescription>
                      </div>
                      {getStatusBadge(video)}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <div className="inline-flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(video.created_at)}</span>
                      </div>
                      <div className="truncate">
                        <span className="opacity-70">Style:</span>{" "}
                        {video.videoStyle}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      {video.audio_url && (
                        <Button size="sm" className="flex-1" asChild>
                          <Link href={`/dashboard/videos/play/${video.id}`}>
                            <Play className="w-4 h-4 mr-2" />
                            Play
                          </Link>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleDeleteClick(video)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-6 h-6 text-rose-400" />
              <h3 className="text-lg font-semibold">Confirm Deletion</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Are you sure you want to delete this video? This action cannot be
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

export default VideosPage;
