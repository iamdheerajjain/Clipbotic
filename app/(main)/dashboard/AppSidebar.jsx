"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  HomeIcon,
  VideoIcon,
  BarChart3Icon,
  PaletteIcon,
  SparklesIcon,
  LogOutIcon,
  UserIcon,
  MoonIcon,
  SunIcon,
  ChevronDownIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/app/providers";
import { useTheme } from "next-themes";
import { signOut } from "firebase/auth";
import { auth } from "@/configs/firebaseconfig";

function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuthContext();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const navigationItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: HomeIcon,
      active: pathname === "/dashboard",
    },
    {
      href: "/dashboard/videos",
      label: "My Videos",
      icon: VideoIcon,
      active: pathname.startsWith("/dashboard/videos"),
    },
    {
      href: "/dashboard/analytics",
      label: "Analytics",
      icon: BarChart3Icon,
      active: pathname.startsWith("/dashboard/analytics"),
    },
    {
      href: "/dashboard/templates",
      label: "Templates",
      icon: PaletteIcon,
      active: pathname.startsWith("/dashboard/templates"),
    },
    {
      href: "/dashboard/debug",
      label: "Debug",
      icon: BarChart3Icon,
      active: pathname === "/dashboard/debug",
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="w-full">
          <div className="flex flex-col w-full gap-2 cursor-pointer hover:opacity-90 transition-opacity duration-200">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl blur-xl bg-gradient-to-br from-purple-500/40 via-blue-500/40 to-purple-600/40 opacity-60" />
                <div className="relative rounded-2xl p-[2px] bg-gradient-to-br from-purple-500/60 via-blue-500/60 to-purple-600/60">
                  <div className="rounded-2xl bg-background/80 p-2 backdrop-blur-sm">
                    <Image
                      src="/logo.svg"
                      alt="Logo"
                      width={28}
                      height={28}
                      className="drop-shadow-lg"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-purple-500">
                  Clipbotic
                </h2>
                <div className="flex items-center gap-1 -mb-2">
                  <SparklesIcon className="w-3 h-3 text-purple-400" />
                  <span className="text-xs text-muted-foreground/70 font-medium">
                    AI Video Studio
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <div className="mx-2 mb-4">
            <Link href={"/dashboard/create"}>
              <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-black font-semibold py-3 rounded-xl shadow-[0_8px_30px_rgba(124,58,237,0.3)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.4)] transition-all duration-300">
                <SparklesIcon className="w-4 h-4 mr-2" />
                Create New Video
              </Button>
            </Link>
          </div>

          <div className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <SidebarItem
                    className={`cursor-pointer ${
                      item.active
                        ? "border-[color-mix(in_oklab,var(--primary)_35%,transparent)] bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] text-foreground shadow-[0_8px_24px_rgba(0,0,0,0.22)]"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg transition-all duration-300 ${
                        item.active
                          ? "bg-gradient-to-br from-purple-600/30 to-blue-600/30"
                          : "bg-muted/50 group-hover:bg-muted"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${
                          item.active
                            ? "text-purple-200"
                            : "text-muted-foreground group-hover:text-foreground"
                        }`}
                      />
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </SidebarItem>
                </Link>
              );
            })}
          </div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="relative w-full">
          {user && (
            <>
              <div
                className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity duration-200 p-2 rounded-lg"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <div className="relative">
                  <div className="absolute inset-0 blur-md rounded-full bg-gradient-to-br from-purple-500/40 to-blue-500/40 opacity-60" />
                  <Image
                    src={user?.photoURL || "/default-avatar.png"}
                    alt="User Profile"
                    width={40}
                    height={40}
                    className="relative rounded-full border-2 border-border shadow-lg"
                    onError={(e) => {
                      e.target.src = "/default-avatar.png";
                    }}
                  />
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-sm font-semibold text-foreground">
                    {user.displayName || "User"}
                  </span>
                  <span className="text-xs text-muted-foreground/70">
                    {user.email}
                  </span>
                </div>
                <ChevronDownIcon
                  className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                    showDropdown ? "rotate-180" : ""
                  }`}
                />
              </div>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-popover border border-border rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden">
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => router.push("/dashboard/profile")}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors duration-200"
                    >
                      <UserIcon className="w-4 h-4" />
                      Profile Settings
                    </button>
                    <div className="border-t border-border my-1" />
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors duration-200"
                    >
                      <LogOutIcon className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}

              {/* Theme Toggle */}
              <div className="mt-3 flex items-center justify-center">
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-purple-500/50 hover:bg-muted/50 transition-all duration-200"
                >
                  {theme === "light" ? (
                    <>
                      <MoonIcon className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-foreground">Dark Mode</span>
                    </>
                  ) : (
                    <>
                      <SunIcon className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-foreground">
                        Light Mode
                      </span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
