"use client";
import React, { useState } from "react";
import { useSupabaseQuery } from "@/hooks/use-supabase";
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
import {
  Database,
  Users,
  Video,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

function DebugPage() {
  const { user } = useAuthContext();
  // Debug queries
  const { data: allVideos, loading: allVideosLoading } = useSupabaseQuery(
    () => supabaseService.getAllVideos(),
    []
  );
  const { data: allUsers, loading: allUsersLoading } = useSupabaseQuery(
    () => supabaseService.getAllUsers(),
    []
  );
  const { data: userVideos, loading: userVideosLoading } = useSupabaseQuery(
    () => (user?._id ? supabaseService.getUserVideos(user._id) : []),
    [user?._id]
  );
  const { data: userVideosByEmail, loading: userVideosByEmailLoading } =
    useSupabaseQuery(
      () => (user?.email ? supabaseService.getVideosByEmail(user.email) : []),
      [user?.email]
    );
  const { data: detailedAnalysis, loading: detailedAnalysisLoading } =
    useSupabaseQuery(() => supabaseService.getDetailedAnalysis(), []);

  if (!user) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-4">
          Please log in to view debug info
        </h2>
      </div>
    );
  }

  // Ensure all data is arrays or null
  const videosArray = Array.isArray(allVideos) ? allVideos : [];
  const usersArray = Array.isArray(allUsers) ? allUsers : [];
  const userVideosArray = Array.isArray(userVideos) ? userVideos : [];
  const userVideosByEmailArray = Array.isArray(userVideosByEmail)
    ? userVideosByEmail
    : [];

  // Check if any queries are still loading
  const isLoading =
    allVideosLoading ||
    allUsersLoading ||
    userVideosLoading ||
    userVideosByEmailLoading ||
    detailedAnalysisLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Database Debug Information"
        description="Check what's in your database and identify any issues"
      />

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
                {usersArray.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {videosArray.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Videos</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {userVideosArray.length}
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
          {userVideosLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              Loading...
            </div>
          ) : userVideosArray.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No videos found for your user ID
            </div>
          ) : (
            <div className="space-y-3">
              {userVideosArray.map((video) => (
                <div key={video.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {video.title || "Untitled"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Topic: {video.topic} • Created:{" "}
                        {new Date(video._creationTime).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {video.audioURL ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      )}
                      <span className="text-xs">
                        {video.audioURL ? "Complete" : "Processing"}
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
          {userVideosByEmailLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              Loading...
            </div>
          ) : userVideosByEmailArray.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No videos found for your email
            </div>
          ) : (
            <div className="space-y-3">
              {userVideosByEmailArray.map((video) => (
                <div key={video.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {video.title || "Untitled"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Topic: {video.topic} • Created:{" "}
                        {new Date(video._creationTime).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {video.audioURL ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      )}
                      <span className="text-xs">
                        {video.audioURL ? "Complete" : "Processing"}
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
                <strong>Videos with Valid UID:</strong>{" "}
                {detailedAnalysis.videosWithValidUid}
              </div>
              <div>
                <strong>Videos with Invalid UID:</strong>{" "}
                {detailedAnalysis.videosWithInvalidUid}
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
          {allVideosLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              Loading...
            </div>
          ) : videosArray.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No videos found in database
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {videosArray.map((video) => (
                <div key={video.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {video.title || "Untitled"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Topic: {video.topic} • UID: {video.uid || "No UID"} •
                        Created:{" "}
                        {new Date(video._creationTime).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {video.audioURL ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      )}
                      <span className="text-xs">
                        {video.uid === user._id ? "Yours" : "Other User"}
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
