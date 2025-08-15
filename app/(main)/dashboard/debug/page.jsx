"use client";
import React, { useState } from "react";
import {
  useGetAllVideos,
  useGetAllUsers,
  useGetUserVideos,
  useGetVideosByEmail,
  useDetailedAnalysis,
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
import {
  Database,
  Users,
  Video,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

function DebugPage() {
  const { user } = useAuthContext();
  const [refreshKey, setRefreshKey] = useState(0);

  // Debug queries - only call when user is available
  const allVideos = useGetAllVideos();
  const allUsers = useGetAllUsers();
  const userVideos = user?._id ? useGetUserVideos(user._id) : null;
  const userVideosByEmail = user?.email
    ? useGetVideosByEmail(user.email)
    : null;
  const detailedAnalysis = useDetailedAnalysis();

  const refreshData = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-4">
          Please log in to view debug info
        </h2>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Database Debug Information"
        description="Check what's in your database and identify any issues"
      />

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button onClick={refreshData} variant="outline">
          🔄 Refresh Data
        </Button>
      </div>

      {/* Current User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Current User Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              <strong>User ID:</strong> {user._id || "Not available"}
            </div>
            <div>
              <strong>Email:</strong> {user.email || "Not available"}
            </div>
            <div>
              <strong>Name:</strong> {user.name || "Not available"}
            </div>
            <div>
              <strong>Picture URL:</strong> {user.pictureURL || "Not available"}
            </div>
            <div>
              <strong>Credits:</strong> {user.credits || "Not available"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {allUsers?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {allVideos?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Videos</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {userVideos?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Your Videos</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Videos by ID */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Your Videos (by User ID)
          </CardTitle>
          <CardDescription>
            Videos found using your Supabase user ID: {user._id}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userVideos == null ? (
            <div className="text-center py-4 text-muted-foreground">
              Loading...
            </div>
          ) : userVideos.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No videos found for your user ID
            </div>
          ) : (
            <div className="space-y-3">
              {userVideos.map((video) => (
                <div key={video.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {video.title || "Untitled"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Topic: {video.topic} • Created:{" "}
                        {new Date(video.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {video.audio_url ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      )}
                      <span className="text-xs">
                        {video.audio_url ? "Complete" : "Processing"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Videos by Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Your Videos (by Email)
          </CardTitle>
          <CardDescription>
            Videos found using your email: {user.email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userVideosByEmail == null ? (
            <div className="text-center py-4 text-muted-foreground">
              Loading...
            </div>
          ) : userVideosByEmail.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No videos found for your email
            </div>
          ) : (
            <div className="space-y-3">
              {userVideosByEmail.map((video) => (
                <div key={video.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {video.title || "Untitled"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Topic: {video.topic} • Created:{" "}
                        {new Date(video.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {video.audio_url ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      )}
                      <span className="text-xs">
                        {video.audio_url ? "Complete" : "Processing"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Analysis */}
      {detailedAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Database Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <strong>Total Videos:</strong> {detailedAnalysis.totalVideos}
              </div>
              <div>
                <strong>Total Users:</strong> {detailedAnalysis.totalUsers}
              </div>
              <div>
                <strong>Videos with Valid User ID:</strong>{" "}
                {detailedAnalysis.videosWithValidUserId}
              </div>
              <div>
                <strong>Videos with Invalid User ID:</strong>{" "}
                {detailedAnalysis.videosWithInvalidUserId}
              </div>
              <div>
                <strong>Orphaned Videos:</strong>{" "}
                {detailedAnalysis.orphanedVideos}
              </div>
              <div>
                <strong>User Emails:</strong>{" "}
                {detailedAnalysis.userEmails?.join(", ") || "None"}
              </div>
              <div>
                <strong>Video Titles:</strong>{" "}
                {detailedAnalysis.videoTitles?.join(", ") || "None"}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Videos (for debugging) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            All Videos in Database
          </CardTitle>
          <CardDescription>
            Complete list of all videos (for debugging purposes)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allVideos == null ? (
            <div className="text-center py-4 text-muted-foreground">
              Loading...
            </div>
          ) : allVideos.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No videos found in database
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {allVideos.map((video) => (
                <div key={video.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {video.title || "Untitled"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Topic: {video.topic} • User ID:{" "}
                        {video.user_id || "No User ID"} • Created:{" "}
                        {new Date(video.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {video.audio_url ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      )}
                      <span className="text-xs">
                        {video.user_id === user._id ? "Yours" : "Other User"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DebugPage;
