"use client";
import React, { useEffect, useState } from "react";
import AppSidebar from "./_components/AppSidebar";
import AppHeader from "./_components/AppHeader";
import { useAuthContext } from "@/app/providers";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function DashboardLayout({ children }) {
  const { user, loading } = useAuthContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You need to be signed in to access the dashboard.
          </p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background animate-fade-in">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto p-6 animate-slide-up">
          <div className="mx-auto max-w-7xl">{children}</div>
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
