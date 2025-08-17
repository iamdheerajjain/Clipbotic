"use client";
import React, { useState } from "react";
import { useAuthContext } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import SectionHeader from "@/components/ui/section-header";
import {
  UserIcon,
  MapPinIcon,
  ClockIcon,
  GlobeIcon,
  EditIcon,
  CheckCircleIcon,
  StarIcon,
  VideoIcon,
} from "lucide-react";
import Image from "next/image";
import { useSupabaseQuery } from "@/hooks/use-supabase";
import { supabaseService } from "@/lib/supabase-service";

export default function ProfileSettings() {
  const { user } = useAuthContext();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || "",
    email: user?.email || "",
    bio: "AI Video Creator passionate about storytelling through technology",
    location: "United States",
    timezone: "America/New_York",
    socialLinks: {
      twitter: "",
      linkedin: "",
      youtube: "",
      instagram: "",
    },
  });

  // Fetch user's videos count and creation date
  const { data: userId, loading: userIdLoading } = useSupabaseQuery(
    () => (user?.email ? supabaseService.getUserIdByEmail(user.email) : null),
    [user?.email]
  );
  const { data: userVideos, loading: userVideosLoading } = useSupabaseQuery(
    () => (userId ? supabaseService.getUserVideos(userId) : []),
    [userId]
  );
  const { data: userData, loading: userDataLoading } = useSupabaseQuery(
    () => (user?.email ? supabaseService.getUserByEmail(user.email) : null),
    [user?.email]
  );

  // Loading states
  const isLoading = userIdLoading || userVideosLoading || userDataLoading;

  const locations = [
    "United States",
    "Canada",
    "United Kingdom",
    "Germany",
    "France",
    "Australia",
    "Japan",
    "India",
    "Brazil",
    "Mexico",
    "South Africa",
    "Singapore",
    "Other",
  ];

  const timezones = [
    { value: "America/New_York", label: "Eastern Time (ET)" },
    { value: "America/Chicago", label: "Central Time (CT)" },
    { value: "America/Denver", label: "Mountain Time (MT)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
    { value: "America/Anchorage", label: "Alaska Time (AKT)" },
    { value: "Pacific/Honolulu", label: "Hawaii Time (HST)" },
    { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
    { value: "Europe/Paris", label: "Central European Time (CET)" },
    { value: "Europe/Berlin", label: "Central European Time (CET)" },
    { value: "Europe/Moscow", label: "Moscow Time (MSK)" },
    { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
    { value: "Asia/Shanghai", label: "China Standard Time (CST)" },
    { value: "Asia/Kolkata", label: "India Standard Time (IST)" },
    { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
    { value: "Pacific/Auckland", label: "New Zealand Standard Time (NZST)" },
  ];

  const handleSave = () => {
    setIsEditing(false);
    console.log("Profile updated:", profileData);
  };

  const handleCancel = () => {
    setProfileData({
      displayName: user?.displayName || "",
      email: user?.email || "",
      bio: "AI Video Creator passionate about storytelling through technology",
      location: "United States",
      timezone: "America/New_York",
      socialLinks: {
        twitter: "",
        linkedin: "",
        youtube: "",
        instagram: "",
      },
    });
    setIsEditing(false);
  };

  // Calculate profile completion percentage
  const profileCompletion = () => {
    const fields = [
      profileData.displayName,
      profileData.bio,
      profileData.location,
      profileData.timezone,
    ];
    const completed = fields.filter(
      (field) => field && field.trim() !== ""
    ).length;
    return Math.round((completed / fields.length) * 100);
  };

  // Format member since date
  const formatMemberSince = (timestamp) => {
    if (!timestamp) return "Recently";
    const date = new Date(timestamp);
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-4">
          Please log in to view your profile
        </h2>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <SectionHeader
        title="Profile Settings"
        subtitle="Manage your account information and profile details"
        actions={
          <Button
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-black font-semibold"
          >
            {isEditing ? (
              <>
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                Save Changes
              </>
            ) : (
              <>
                <EditIcon className="w-4 h-4 mr-2" />
                Edit Profile
              </>
            )}
          </Button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mt-8">
        {/* Left Sidebar - Profile Overview */}
        <div className="xl:col-span-1 space-y-6">
          {/* Profile Card */}
          <Card className="text-center border-0 shadow-lg bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-xl">
            <CardHeader className="pb-6">
              <div className="mx-auto relative mb-6">
                <div className="absolute inset-0 blur-2xl rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 opacity-80" />
                <Image
                  src={user?.photoURL || "/default-avatar.png"}
                  alt="Profile Picture"
                  width={120}
                  height={120}
                  className="relative rounded-full border-4 border-white/20 shadow-2xl mx-auto"
                  onError={(e) => {
                    e.target.src = "/default-avatar.png";
                  }}
                />
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                {user.displayName || "User"}
              </CardTitle>
              <CardDescription className="text-muted-foreground text-base">
                {user.email}
              </CardDescription>
              <div className="flex justify-center gap-2 mt-4">
                <Badge variant="outline" className="px-3 py-1">
                  <CheckCircleIcon className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Profile Completion */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Profile Complete
                  </span>
                  <span className="font-semibold text-white">
                    {isLoading ? "..." : `${profileCompletion()}%`}
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: isLoading ? "0%" : `${profileCompletion()}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Stats */}
              <div className="pt-4">
                <div className="text-center p-4 rounded-lg bg-white/5">
                  <div className="flex items-center justify-center mb-2">
                    <VideoIcon className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {isLoading ? "..." : userVideos ? userVideos.length : 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Videos Created
                  </div>
                  {!isLoading && (
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Real-time from database
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <StarIcon className="w-4 h-4" />
                  Member since{" "}
                  {isLoading
                    ? "Loading..."
                    : userData
                    ? formatMemberSince(userData.createdAt)
                    : "Recently"}
                </div>
                {!isLoading && !userData && (
                  <p className="text-xs text-muted-foreground/70 mt-1 text-center">
                    Account created recently
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Profile Form */}
        <div className="xl:col-span-3 space-y-6">
          {/* Personal Information */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-xl">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <UserIcon className="w-6 h-6 text-purple-400" />
                </div>
                Personal Information
              </CardTitle>
              <CardDescription className="text-base">
                Update your profile details and personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Name and Email Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-white flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-purple-400" />
                    Display Name
                  </label>
                  <Input
                    value={profileData.displayName}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        displayName: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                    placeholder="Enter your display name"
                    className="h-12 text-base border-white/20 bg-white/5 focus:border-purple-500 focus:ring-purple-500/20"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-white flex items-center gap-2">
                    <GlobeIcon className="w-4 h-4 text-blue-400" />
                    Email Address
                  </label>
                  <Input
                    value={profileData.email}
                    disabled
                    className="h-12 text-base border-white/20 bg-muted/50 cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed for security reasons
                  </p>
                </div>
              </div>

              {/* Bio Section */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-white">Bio</label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) =>
                    setProfileData({ ...profileData, bio: e.target.value })
                  }
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-white/20 rounded-lg bg-white/5 text-white placeholder-muted-foreground disabled:bg-muted/50 disabled:cursor-not-allowed focus:border-purple-500 focus:ring-purple-500/20 resize-none"
                  rows={4}
                  placeholder="Tell us about yourself, your interests, and what you create..."
                />
                <p className="text-xs text-muted-foreground">
                  {profileData.bio.length}/200 characters
                </p>
              </div>

              {/* Location and Timezone Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-white flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4 text-green-400" />
                    Location
                  </label>
                  <select
                    value={profileData.location}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        location: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                    className="w-full h-12 px-4 border border-white/20 rounded-lg bg-white/5 text-white disabled:bg-muted/50 disabled:cursor-not-allowed focus:border-purple-500 focus:ring-purple-500/20"
                  >
                    {locations.map((location) => (
                      <option
                        key={location}
                        value={location}
                        className="bg-black text-white"
                      >
                        {location}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-white flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-yellow-400" />
                    Timezone
                  </label>
                  <select
                    value={profileData.timezone}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        timezone: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                    className="w-full h-12 px-4 border border-white/20 rounded-lg bg-white/5 text-white disabled:bg-muted/50 disabled:cursor-not-allowed focus:border-purple-500 focus:ring-purple-500/20"
                  >
                    {timezones.map((tz) => (
                      <option
                        key={tz.value}
                        value={tz.value}
                        className="bg-black text-white"
                      >
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex gap-4 pt-6 border-t border-white/10">
                  <Button
                    onClick={handleSave}
                    className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
                  >
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    Save Changes
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="flex-1 h-12 border-white/20 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
