"use client";
import React, { useState } from "react";
import { useGetUserVideos, useDeleteVideo } from "@/hooks/use-supabase";
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
} from "lucide-react";
import Link from "next/link";

function DashboardOverview() {
  const { user } = useAuthContext();
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Allow Firebase UIDs as temporary IDs for immediate functionality
  const userId = user?.supabaseId || user?.uid;
  const videos = useGetUserVideos(userId);

  // Delete mutation
  const [deleteVideo, { loading: deleteLoading }] = useDeleteVideo();

  if (!user) {
    return null;
  }

  const completedVideos = videos?.filter((video) => video.audio_url) || [];
  const processingVideos = videos?.filter((video) => !video.audio_url) || [];
  const recentVideos = videos?.slice(0, 3) || [];

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const handleDeleteClick = (video) => {
    setDeleteConfirm(video);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm || !user || !userId) return;

    try {
      await deleteVideo(deleteConfirm.id, userId);
      setDeleteConfirm(null);
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
        <StatCard
          title="Total Videos"
          value={videos?.length || 0}
          icon={Play}
        />
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
                    <p className="text-sm text-muted-foreground">
                      {video.topic} • {formatDate(video.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {video.audio_url ? (
                      <Badge variant="success" className="gap-1.5">
                        <CheckCircle className="w-3 h-3" /> Complete
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="gap-1.5">
                        <Clock className="w-3 h-3" /> Processing
                      </Badge>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <h3 className="text-lg font-bold">Confirm Deletion</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete "
              {deleteConfirm.title || "Untitled Video"}"? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
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
