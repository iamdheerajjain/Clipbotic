"use client";
import React, { useState } from "react";
import AppSidebar from "./_components/AppSidebar";
import { useAuthContext } from "@/app/providers";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ToastContainer, useToast } from "@/components/ui/toast";

function DashboardLayout({ children }) {
  const { user, loading } = useAuthContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toasts, removeToast } = useToast();

  if (loading) {
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
    <div className="flex h-screen bg-background">
      <AppSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <main
        className={`flex-1 overflow-auto transition-all duration-150 ${
          sidebarOpen ? "ml-0" : "ml-0"
        }`}
      >
        <div className="mx-auto p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </div>
      </main>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default DashboardLayout;
