"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Authentication from "@/components/Authentication";
import { useAuthContext } from "@/app/providers";
import { signOut } from "firebase/auth";
import { auth } from "@/configs/firebaseconfig";
import { useRouter } from "next/navigation";
import {
  ChevronDownIcon,
  UserIcon,
  LogOutIcon,
  MoonIcon,
  SunIcon,
} from "lucide-react";
import { useTheme } from "next-themes";

export default function Header() {
  const { user } = useAuthContext();
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      // Silent error handling for sign out
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <header className="sticky top-0 z-50 p-4 flex items-center justify-between border-b border-border bg-background shadow-sm">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl blur-xl bg-gradient-to-br from-purple-500/40 via-blue-500/40 to-purple-600/40 opacity-60" />
          <div className="relative rounded-2xl p-[2px] bg-gradient-to-br from-purple-500/60 via-blue-500/60 to-purple-600/60">
            <div className="rounded-2xl bg-background/80 p-2 backdrop-blur-sm">
              <Image
                src="/logo.svg"
                alt="Video Gen Logo"
                width={32}
                height={32}
                priority
                className="drop-shadow-lg"
              />
            </div>
          </div>
        </div>
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-purple-500">
          Clipbotic
        </h1>
      </div>

      <nav>
        {!user ? (
          <Authentication>
            <Button variant="default">Get Started</Button>
          </Authentication>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-black font-semibold py-2 px-4 rounded-xl shadow-[0_8px_30px_rgba(124,58,237,0.3)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.4)] transition-all duration-300">
                Dashboard
              </Button>
            </Link>
            <div className="relative">
              <div
                className="cursor-pointer hover:opacity-90 transition-opacity duration-200"
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
              </div>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div
                  ref={dropdownRef}
                  className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden z-50"
                >
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => router.push("/dashboard/profile")}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors duration-200"
                    >
                      <UserIcon className="w-4 h-4" />
                      Profile Settings
                    </button>
                    <button
                      onClick={toggleTheme}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors duration-200"
                    >
                      {theme === "light" ? (
                        <>
                          <MoonIcon className="w-4 h-4" />
                          Dark Mode
                        </>
                      ) : (
                        <>
                          <SunIcon className="w-4 h-4" />
                          Light Mode
                        </>
                      )}
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
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
